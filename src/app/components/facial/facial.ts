import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  statusMessage = 'Carregando modelos...';
  statusKind: StatusKind = 'waiting';
  punchType: 'entry' | 'exit' | null = null;
  private stream?: MediaStream;
  private interval?: any;
  public blocked = false;
  private blockTimeout?: any;
  private blockEndTime: number = 0;
  private blockTimerInterval?: any;
  public readyToPunch = false;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await this.initFace();
  }

  ngOnDestroy() {
    this.releaseCamera();
    if (this.interval) clearInterval(this.interval);
    if (this.blockTimeout) clearTimeout(this.blockTimeout);
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);
  }

  async initFace() {
    this.releaseCamera();
    this.setStatus('Carregando modelos...', 'waiting');
    this.blocked = false;
    if (this.blockTimeout) clearTimeout(this.blockTimeout);
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);

    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models/tiny_face_detector_model');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models/face_landmark_68_model');
      this.setStatus('Buscando webcam...', 'waiting');

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (videoDevices.length === 0) {
        this.setStatus('Nenhuma webcam encontrada neste dispositivo.', 'error');
        return;
      }

      this.setStatus('Solicitando acesso à webcam...', 'waiting');
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoRef.nativeElement.srcObject = this.stream;
      this.videoRef.nativeElement.muted = true;
      await this.videoRef.nativeElement.play();

      this.setStatus('Aguardando rosto...', 'waiting');

      this.videoRef.nativeElement.onplay = () => {
        this.detectLoop();
      };
    } catch (err: any) {
      if (err?.name === 'NotFoundError' || err?.message?.includes('not be found') || err?.message?.includes('getEnv')) {
        this.setStatus('Nenhuma webcam detectada ou não suportada neste dispositivo.', 'error');
      } else if (err?.name === 'NotAllowedError') {
        this.setStatus('Permissão de acesso à webcam negada.', 'error');
      } else {
        this.setStatus('Erro ao acessar webcam: ' + (err?.message || err), 'error');
      }
      console.error('Erro ao acessar webcam:', err);
    }    
  }

  setStatus(message: string, kind: StatusKind) {
    this.statusMessage = message;
    this.statusKind = kind;
  }

  releaseCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = undefined;
    }
  }

  startBlockCountdown(seconds: number) {
    this.blocked = true;
    this.blockEndTime = Date.now() + seconds * 1000;
    this.setStatus(`Aguarde ${seconds} segundos para nova batida...`, 'blocked');
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);

    this.blockTimerInterval = setInterval(() => {
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
    if (this.interval) clearInterval(this.interval);
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    this.interval = setInterval(async () => {
      if (this.blocked) return;

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const context = canvas.getContext('2d');
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        const main = detections[0].detection.box;
        const minWidth = displaySize.width * 0.25;
        const minHeight = displaySize.height * 0.25;
        if (main.width < minWidth || main.height < minHeight) {
          this.setStatus('Aproxime o rosto da câmera', 'hint');
          this.readyToPunch = false;
        } else {
          this.setStatus('Rosto detectado! Escolha o tipo de ponto abaixo.', 'ok');
          faceapi.draw.drawDetections(canvas, [detections[0]]);
          faceapi.draw.drawFaceLandmarks(canvas, [detections[0]]);
          this.readyToPunch = true;
        }
      } else {
        this.setStatus('Aguardando rosto...', 'waiting');
        this.readyToPunch = false;
      }
    }, 150);
  }

  getBase64FromVideo(video: HTMLVideoElement): string {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
  }

  async punch(type: 'entry' | 'exit') {
    if (this.blocked) return;
    if (!this.readyToPunch) {
      this.setStatus('Aproxime o rosto e aguarde reconhecimento antes de registrar o ponto.', 'hint');
      return;
    }
    this.setStatus('Registrando ponto...', 'sending');
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
  }

  async refreshCamera() {
    this.setStatus('Atualizando câmera...', 'waiting');
    if (this.blockTimerInterval) clearInterval(this.blockTimerInterval);
    this.blocked = false;
    await this.initFace();
  }
}
