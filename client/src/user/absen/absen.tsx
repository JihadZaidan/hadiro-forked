/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import assets from '../../assets/assets.ts';
import Sidebar from "../../components/sidebar"
import * as faceapi from '@vladmandic/face-api';
import apiClient from '../../api/axios';

function Absen() {
  const history = [
    { student: "JANE DOE", created_at: "07.10", photo: assets.foto },
    { student: "JOHN SMITH", created_at: "06.45", photo: assets.foto },
    { student: "ABED GREATVO SUSENO", created_at: "06.20", photo: assets.foto },
  ];
  const [isModalOpen, setModalOpen] = useState(false);
  const [kelas, setKelas] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [kode, setKode] = useState('');
  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };
  
  const webcamRef = useRef<HTMLVideoElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const instructionCanvasRef = useRef<HTMLCanvasElement>(null);
  const takePhotoButtonRef = useRef<HTMLButtonElement>(null);
  const capturePhotoButtonRef = useRef<HTMLButtonElement>(null);
  const studentSelectRef = useRef<HTMLSelectElement>(null);  

  let initialDescriptor: Float32Array | null = null;
  // let currentDescriptor: Float32Array | null = null;
  // let canTakePhoto = false;
  let challengeDone = false;
  const canTakePhotoRef = useRef(false);
  const currentDescriptorRef = useRef<null | Float32Array>(null);

  const initializedRef = useRef(false);

  const takePhotoButton = takePhotoButtonRef.current;
  const studentSelect = studentSelectRef.current;

  let handleTakePhotoClick = () => {
    console.log("Taken the your photos!");
  };
  
  if (takePhotoButton && studentSelect) {
    handleTakePhotoClick = () => {
      if (canTakePhotoRef.current && currentDescriptorRef.current) {
        takePhotoButton.disabled = true;
        studentSelect.disabled = true;
        studentSelect.innerHTML = '';
        const firstOption = document.createElement('option');
        studentSelect.appendChild(firstOption);

        findClosestMatches(currentDescriptorRef.current)
          .then((matches: { label: string, distance: number }[]) => {
            if (matches.length) {
              firstOption.text = 'Pilih siswa';
              matches.forEach((match) => {
                const option = document.createElement('option');
                option.style.color = 'black';
                option.value = match.label; 
                option.text = `${match.label}`;
                studentSelect.appendChild(option);
              });
            } else {
              firstOption.text = 'Tidak ada siswa yang sesuai dengan wajah itu';
            }
          })
          .catch((error) => {
            console.error('Error finding closest matches:', error);
          })
          .finally(() => {
            takePhotoButton.disabled = false;
            studentSelect.disabled = false;
          });
      }
    };
  }

  const findClosestMatches = async (descriptor: Float32Array) => {

    const descriptorArray = Array.from(descriptor);

    try {
      const response = await apiClient.post('/face/findClosestMatches', {
        // Send request body as needed
        descriptor: descriptorArray
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      //console.log('API Response:', response);
      //console.log('Response Data:', response.data);
      //console.log('Closest Matches', response.data.closestMatches)

      // Ensure the response data contains the expected structure
      if (response.data && response.data.closestMatches) {
        //console.log('Returning closestMatches:', response.data.closestMatches);
        return response.data.closestMatches;
      } else {
        console.error('Unexpected response structure:', response.data);
        throw new Error('Unexpected response structure');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error; // Re-throw the error to be caught by the caller
    }
  };

  useEffect(() => {
    const button = capturePhotoButtonRef.current;
    if (button) {
      button.addEventListener('click', handleTakePhotoClick);
      return;
    }
  }, [isModalOpen]);

  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      const modelsPath = "./face-api-models";

      // Load models
      //await faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath);
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
      await faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
      
      const video = webcamRef.current;
      const faceCanvas = faceCanvasRef.current;
      const instructionCanvas = instructionCanvasRef.current;
      const takePhotoButton = takePhotoButtonRef.current;
      takePhotoButton.addEventListener('click', toggleModal);

      let currentStream: MediaStream | null = null;

      // Start video stream
      const startVideoStream = async () => {
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: true,
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (video) {
          video.srcObject = currentStream;

          const settings = currentStream.getVideoTracks()[0].getSettings();
          if (faceCanvas && instructionCanvas) {
            faceCanvas.width = settings.width || 640;
            faceCanvas.height = settings.height || 480;
            instructionCanvas.width = settings.width || 640;
            instructionCanvas.height = settings.height || 480;
          }
        }
      };

      // Initialize
      await startVideoStream();
      if (video && faceCanvas && instructionCanvas && takePhotoButton) {
        detectRealTime(video, faceCanvas, instructionCanvas, takePhotoButton);
      }

      // Cleanup
      return () => {
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }
      };
    }

    const detectRealTime = async (video: HTMLVideoElement, faceCanvas: HTMLCanvasElement, instructionCanvas: HTMLCanvasElement, takePhotoButton: HTMLButtonElement) => {
      const ctx = faceCanvas.getContext('2d');
      const ictx = instructionCanvas.getContext('2d');

      if (!ctx || !ictx) {
        alert("Something went wrong with the canvas 2D context!");
        return;
      }

      function drawInstructions(instructionText: string) {
        if (!ctx || !ictx) {
          alert("Something went wrong with the canvas 2D context!");
          return;
        }

        ictx.clearRect(0, 0, instructionCanvas.width, instructionCanvas.height);

        ictx.font = "bold 24px Arial";
        ictx.fillStyle = "white";
        ictx.textAlign = "center";

        const textWidth = ictx.measureText(instructionText).width;
        const padding = 20;
        const textX = ictx.canvas.width / 2;
        const textY = ictx.canvas.height - 50;
        ictx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ictx.fillRect(textX - textWidth / 2 - padding / 2, textY - 30, textWidth + padding, 40);

        ictx.fillStyle = "white";
        ictx.fillText(instructionText, textX, textY);
      }

      async function detectFrame() {
        if (!ctx || !ictx) {
          alert("Something went wrong with the canvas 2D context!");
          return;
        }

        // Detect faces
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptor();

        ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
        ictx.clearRect(0, 0, instructionCanvas.width, instructionCanvas.height);

        if (!detection) {
          canTakePhotoRef.current = false;
          initialDescriptor = null;
          challengeDone = false;
          drawInstructions("Wajah tidak terdeteksi");
          return;
        }

        currentDescriptorRef.current = detection.descriptor;

        // Draw boxes and details for each detection
        const box = detection.detection.box;
        const { width, height, top, left } = box;

        // Draw the bounding box
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 4;
        ctx.strokeRect(left, top, width, height);

        if (!initialDescriptor) {
          initialDescriptor = detection.descriptor;
        } else {
          const distance = faceapi.euclideanDistance(initialDescriptor, currentDescriptorRef.current);

          if (distance > 0.6) {
            //console.log("Face mismatch, restarting!");
            drawInstructions("Wajah tidak sesuai, tolong ulangi dari awal");
            initialDescriptor = null;
            challengeDone = false;
          } else {
            if (!challengeDone) {
              const happyScore = detection.expressions.happy;
              drawInstructions(`Tolong senyum dengan lebar (${Math.min(Math.floor((happyScore / 0.7) * 100), 100)}%)`);

              if (happyScore > 0.7) {
                challengeDone = true;
              }
            } else {
              drawInstructions("Wajah siap untuk difoto");
              canTakePhotoRef.current = true;
            }
          }
        }

        takePhotoButton.disabled = !canTakePhotoRef.current;
      }

      setInterval(() => detectFrame(), 500);
    };

    initialize();
  }, []);

  return (
    <>
      <div className="flex">
        <div className="sm:w-1/2 md:w-1/3 lg:w-1/4 h-full">
          <Sidebar active="Absen Sekarang" />
        </div>
        <div className="w-full pt-[78px]">
          <div className="p-12">
            <div className="grid gap-5 lg:grid-cols-3 lg:grid-rows-1">
              <div className="lg:col-span-2 w-full">
                <h1 className="text-3xl font-bold">Dokumentasi Kehadiran</h1>
                <button
                  onClick={toggleModal}
                  ref={takePhotoButtonRef}
                  disabled
                  className="flex items-center p-2 px-3 rounded mt-5 text-white bg-[#1A73E8] hover:text-white shadow-md shadow-gray-500 focus:outline-none"
                >
                  Ambil Foto
                </button>
                <div className="w-full bg-[#413C3C] my-5 p-5 flex flex-col justify-center items-center">
                  <div className="flex mb-5">
                    <select
                      id="studentSelect"
                      className="bg-transparent text-white text-xl pe-5 focus:outline-none"
                      ref={studentSelectRef}
                      disabled
                    >
                      <option>Ambillah foto terlebih dahulu</option>
                    </select>
                    <img src={assets.camera} className="w-8 ml-5" />
                  </div>
                  <div className="relative bg-[#090909] w-full aspect-[4/3] rounded-lg p-5 flex justify-center items-center">
                    <video
                      id="webcam"
                      ref={webcamRef}
                      autoPlay
                      muted
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    ></video>
                    <canvas
                      id="faceCanvas"
                      ref={faceCanvasRef}
                      className="absolute inset-0 w-full h-full rounded-lg"
                    ></canvas>
                    <canvas
                      id="instructionCanvas"
                      ref={instructionCanvasRef}
                      className="absolute inset-0 w-full h-full rounded-lg"
                    ></canvas>
                  </div>
                </div>
              </div>
              <div className="w-full h-screen overflow-y-auto mr-1 lg:w-auto lg:col-span-1">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="w-full border border-black rounded-lg bg-[#E1EEFF] p-5 flex items-center justify-start shadow-md shadow-gray-500 mb-3"
                  >
                    <img src={item.photo} className="h-full object-cover" />
                    <div className="ml-5 flex flex-col">
                      <span className="font-semibold">{item.student}</span>
                      <span>Jam Kedatangan: {item.created_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen ? (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg w-[400px]">
            <div className="flex justify-between items-center p-8 w-full border-b border-[#C5C5C5]">
              <h1 className="text-xl font-bold">Detail Siswa</h1>
              <button
                className="text-black bg-white hover:bg-white focus:outline-none p-0"
                onClick={toggleModal}
              >
                X
              </button>
            </div>
            <div className='p-8'>
              <div className="mb-4 flex items-center">
                <label className="block mr-4 w-24">Kelas:</label>
                <select className="w-full border border-gray-300 rounded-lg p-2" value={kelas} onChange={(e) => setKelas(e.target.value)}>
                  <option value="">Semua</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
              </div>
              <div className="mb-4 flex items-center">
                <label className="block mr-4 w-24">Jurusan:</label>
                <select className="w-full border border-gray-300 rounded-lg p-2" value={jurusan} onChange={(e) => setJurusan(e.target.value)}>
                  <option value="">Semua</option>
                  <option value="TG">TG</option>
                  <option value="DKV">DKV</option>
                  <option value="RPL">RPL</option>
                  <option value="ANI">ANI</option>
                  <option value="TKJ">TKJ</option>
                  <option value="MEKA">MEKA</option>
                  <option value="TL">TL</option>
                  <option value="PH">PH</option>
                </select>
              </div>
              <div className="mb-8 flex items-center">
                <label className="block mr-4 w-24">Kode:</label>
                <input
                  type="text"
                  maxLength={1}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                />
              </div>
              <div className="flex">
                <button
                  id="takePhoto"
                  ref={capturePhotoButtonRef}
                  className="bg-blue-500 text-white rounded-lg px-4 py-2 shadow-md shadow-gray-500 focus:outline-none"
                >
                  Ambil Foto
                </button>
                <button
                  className="bg-white hover:bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 ml-2 focus:outline-none"
                  onClick={toggleModal}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button id="takePhoto" ref={capturePhotoButtonRef}></button>
      )}
    </>
  );
}

export default Absen;
