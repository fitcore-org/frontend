import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as faceapi from 'face-api.js';

type StatusKind = 'waiting' | 'ok' | 'error' | 'hint';

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

  private stream?: MediaStream;
  private interval?: any;

  async ngOnInit() {
    await this.initFace();
  }

  ngOnDestroy() {
    this.releaseCamera();
    if (this.interval) clearInterval(this.interval);
  }

  async initFace() {
    this.releaseCamera();
    this.setStatus('Carregando modelos...', 'waiting');
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
      this.setStatus('Erro ao acessar webcam: ' + (err?.message || err), 'error');
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

  async detectLoop() {
    if (this.interval) clearInterval(this.interval);
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    this.interval = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      const context = canvas.getContext('2d');
      if (context) context.clearRect(0, 0, canvas.width, canvas.height);

      if (detections.length > 0) {
        // Checa se o rosto está suficientemente grande (mais de 20% da largura da câmera)
        const main = detections[0].detection.box;
        const minWidth = displaySize.width * 0.25;
        const minHeight = displaySize.height * 0.25;
        if (main.width < minWidth || main.height < minHeight) {
          this.setStatus('Aproxime o rosto da câmera', 'hint');
        } else {
          this.setStatus('Rosto detectado!', 'ok');
        }
        faceapi.draw.drawDetections(canvas, [detections[0]]);
        faceapi.draw.drawFaceLandmarks(canvas, [detections[0]]);
      } else {
        this.setStatus('Aguardando rosto...', 'waiting');
      }
    }, 120);
  }

  async refreshCamera() {
    this.setStatus('Atualizando câmera...', 'waiting');
    await this.initFace();
  }
}
