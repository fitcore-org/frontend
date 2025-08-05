import { Component, ElementRef, OnInit, ViewChild, OnDestroy, NgZone, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as faceapi from 'face-api.js';

type StatusKind = 'waiting' | 'ok' | 'error' | 'hint' | 'sending' | 'success' | 'blocked';

@Component({
  selector: 'app-facial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facial.html',
  styleUrls: ['./facial.scss']
})
export class Facial implements OnInit, OnDestroy {
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  statusMessage = '';
  statusKind: StatusKind = 'waiting';
  punchType: 'entry' | 'exit' | null = null;
  public blocked = false;
  public readyToPunch = false;

  private stream?: MediaStream;
  private interval?: number;
  private blockTimeout?: number;
  private blockEndTime: number = 0;
  private blockTimerInterval?: number;
  private loading = false;
  private destroy = false;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}
  

  async ngOnInit() {
    if (!this.isBrowser()) {
      this.setStatus('Esse recurso só está disponível no navegador.', 'error');
      return;
    }
    await this.safeInitFace();
  }

  ngOnDestroy() {
    this.destroy = true;
    this.releaseCamera();
    if (this.interval) clearInterval(this.interval);
    if (this.blockTimeout) clearTimeout(this.blockTimeout);
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);
  }

  private isBrowser() {
    return isPlatformBrowser(this.platformId);
  }

  private async safeInitFace() {
    try {
      await this.initFace();
    } catch (err) {
      this.setStatus('Erro inesperado. Recarregue a página ou tente outro navegador.', 'error');
      this.releaseCamera();
      console.error(err);
    }
  }

  async initFace() {
    this.releaseCamera();
    this.setStatus('Carregando modelos de reconhecimento facial...', 'waiting');
    this.blocked = false;
    this.readyToPunch = false;
    if (this.blockTimeout) clearTimeout(this.blockTimeout);
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);
    this.loading = true;

    try {
      await Promise.race([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models/ssd_mobilenetv1_model'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout no carregamento dos modelos.')), 15000))
      ]);
      await Promise.race([
        faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models/face_landmark_68_model'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout no carregamento dos modelos.')), 15000))
      ]);
    } catch (e: any) {
      this.setStatus(e?.message || 'Erro ao carregar modelos de reconhecimento.', 'error');
      this.loading = false;
      return;
    }

    this.setStatus('Buscando webcam...', 'waiting');

    let videoDevices: MediaDeviceInfo[];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoDevices.length === 0) {
        this.setStatus('Nenhuma webcam encontrada neste dispositivo.', 'error');
        this.loading = false;
        return;
      }
    } catch {
      this.setStatus('Erro ao acessar as câmeras do dispositivo.', 'error');
      this.loading = false;
      return;
    }

    this.setStatus('Solicitando acesso à webcam...', 'waiting');
    let lastError: any;
    for (let device of videoDevices) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } });
        break;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
    if (!this.stream) {
      if (lastError?.name === 'NotAllowedError') {
        this.setStatus('Permissão de acesso à webcam negada. Habilite nas configurações do navegador.', 'error');
      } else if (lastError?.name === 'NotFoundError' || lastError?.message?.includes('not be found')) {
        this.setStatus('Nenhuma webcam detectada ou conectada.', 'error');
      } else {
        this.setStatus('Erro ao acessar webcam: ' + (lastError?.message || lastError), 'error');
      }
      this.loading = false;
      return;
    }

    // Inicia vídeo e canvas
    try {
      const videoEl = this.videoRef.nativeElement;
      videoEl.srcObject = this.stream;
      videoEl.muted = true;
      await videoEl.play();
    } catch (err) {
      this.setStatus('Não foi possível iniciar o vídeo da webcam.', 'error');
      this.loading = false;
      return;
    }

    this.setStatus('Aguardando rosto...', 'waiting');
    this.loading = false;

    this.ngZone.runOutsideAngular(() => {
      this.detectLoop();
    });
  }

  setStatus(message: string, kind: StatusKind) {
    this.statusMessage = message;
    this.statusKind = kind;
    this.cdr.detectChanges();
  }
  

  releaseCamera() {
    if (!this.isBrowser()) return; // proteção SSR

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.stream = undefined;
    }
    if (this.interval) clearInterval(this.interval);
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);
    if (this.blockTimeout) clearTimeout(this.blockTimeout);

    // Protege acesso ao canvas apenas em ambiente browser
    const canvasEl = this.canvasRef?.nativeElement;
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
  }

  startBlockCountdown(seconds: number) {
    this.blocked = true;
    this.blockEndTime = Date.now() + seconds * 1000;
    this.setStatus(`Aguarde ${seconds} segundos para nova batida...`, 'blocked');
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);

    this.blockTimerInterval = window.setInterval(() => {
      if (this.destroy) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((this.blockEndTime - now) / 1000));
      if (remaining > 0) {
        this.setStatus(`Aguarde ${remaining} segundos para nova batida...`, 'blocked');
      } else {
        this.blocked = false;
        clearInterval(this.blockTimerInterval);
        this.setStatus('Aguardando rosto...', 'waiting');
      }
    }, 1000);
  }

  async detectLoop() {
    if (!this.isBrowser()) return;

    if (this.interval) clearInterval(this.interval);
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    let failCount = 0;
    let debounce = false;
    this.interval = window.setInterval(async () => {
      if (this.destroy) return;
      if (this.blocked || this.loading) return;
      if (debounce) return;
      debounce = true;
      setTimeout(() => debounce = false, 130);

      const context = canvas.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.save();
      context.strokeStyle = 'rgba(250,204,21,0.3)';
      context.lineWidth = 3;
      const overlayW = displaySize.width * 0.38;
      const overlayH = displaySize.height * 0.52;
      context.strokeRect(
        (displaySize.width - overlayW) / 2,
        (displaySize.height - overlayH) / 2,
        overlayW,
        overlayH
      );
      context.restore();

      let detections: any[] = [];
      try {
        detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks();
      } catch (e: any) {
        if (e?.message?.includes('getEnv')) {
          this.setStatus('Este navegador ou ambiente não suporta processamento de vídeo.', 'error');
          clearInterval(this.interval);
        } else {
          this.setStatus('Erro na detecção facial. Recarregue.', 'error');
        }
        return;
      }

      if (detections.length > 0 && detections[0].detection.score > 0.7) {
        failCount = 0;
        const main = detections[0].detection.box;
        const minWidth = displaySize.width * 0.18;
        const minHeight = displaySize.height * 0.18;
        if (main.width < minWidth || main.height < minHeight) {
          this.setStatus('Aproxime o rosto da câmera', 'hint');
          this.readyToPunch = false;
        } else {
          this.setStatus('Rosto detectado! Escolha o tipo de ponto abaixo.', 'ok');
          context.save();
          context.strokeStyle = '#22c55e';
          context.lineWidth = 4;
          context.shadowColor = "#4ade80";
          context.shadowBlur = 14;
          context.strokeRect(main.x, main.y, main.width, main.height);
          context.restore();
          if (detections[0].detection.score > 0.8)
            faceapi.draw.drawFaceLandmarks(canvas, [detections[0]]);
          this.readyToPunch = true;
        }
      } else {
        failCount++;
        this.setStatus('Aguardando rosto...', 'waiting');
        this.readyToPunch = false;
        if (failCount > 30) {
          this.setStatus('Não foi possível detectar rosto. Verifique iluminação e posição.', 'error');
          failCount = 0;
        }
      }
    }, 180);
  }

  getBase64FromVideo(video: HTMLVideoElement): string {
    if (!this.isBrowser()) return '';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
  }

  async punch(type: 'entry' | 'exit') {
    if (this.blocked || this.loading) return;
    if (!this.readyToPunch) {
      this.setStatus('Aproxime o rosto e aguarde reconhecimento antes de registrar o ponto.', 'hint');
      return;
    }
    this.setStatus('Registrando ponto...', 'sending');
    this.loading = true;
    const image_base64 = this.getBase64FromVideo(this.videoRef.nativeElement);
    const payload = { image_base64, type };
    try {
      const result = await this.http.post<any>(
        'http://localhost:8000/attendance/punch',
        payload
      ).toPromise();
      if (result?.id) {
        this.setStatus(`Ponto registrado com sucesso! (${type === 'entry' ? 'Entrada' : 'Saída'})`, 'success');
      } else {
        this.setStatus('Não foi possível registrar o ponto.', 'error');
      }
      this.startBlockCountdown(60);
    } catch (error: any) {
      if (error?.error?.detail) {
        this.setStatus(error.error.detail, 'error');
      } else {
        this.setStatus('Erro ao registrar o ponto.', 'error');
      }
      this.startBlockCountdown(60);
    }
    this.loading = false;
  }

  async refreshCamera() {
    this.setStatus('Atualizando câmera...', 'waiting');
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);
    this.blocked = false;
    this.readyToPunch = false;
    this.loading = false;
    await this.safeInitFace();
  }
}
