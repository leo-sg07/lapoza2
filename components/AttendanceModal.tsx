
import React, { useState, useRef, useEffect } from 'react';
import { calculateDistance } from '../utils/geoUtils';
import { Branch } from '../types';

interface AttendanceModalProps {
  onClose: () => void;
  onSuccess: (photo: string) => void;
  type: 'CHECK_IN' | 'CHECK_OUT';
  branch: Branch;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ onClose, onSuccess, type, branch }) => {
  const [step, setStep] = useState<'LOCATION' | 'CAMERA' | 'PROCESSING'>('LOCATION');
  const [error, setError] = useState<string | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (step === 'LOCATION') {
      const getPosition = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const distance = calculateDistance(
              pos.coords.latitude,
              pos.coords.longitude,
              branch.lat,
              branch.lng
            );
            setCurrentDistance(Math.round(distance));
            
            if (distance <= branch.radius) {
              setStep('CAMERA');
            } else {
              setError(`Bạn đang cách chi nhánh ${Math.round(distance)}m. (Yêu cầu < ${branch.radius}m). Tọa độ GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            }
          },
          (err) => {
            console.error(err);
            setError("Không thể truy cập vị trí. Vui lòng cấp quyền vị trí cho trình duyệt.");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      };

      getPosition();
    }
  }, [step, branch]);

  useEffect(() => {
    if (step === 'CAMERA') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Không thể mở Camera. Vui lòng cấp quyền.");
        });
    }
  }, [step]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 400, 300);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setStep('PROCESSING');
        
        setTimeout(() => {
          onSuccess(dataUrl);
          const stream = videoRef.current?.srcObject as MediaStream;
          stream?.getTracks().forEach(track => track.stop());
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {type === 'CHECK_IN' ? 'Điểm danh Vào Ca' : 'Điểm danh Ra Ca'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{branch.name}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-xs leading-relaxed border border-red-100">
              <div className="font-bold mb-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Lỗi xác thực:
              </div>
              {error}
              <button 
                onClick={() => { setError(null); setStep('LOCATION'); }}
                className="block mt-2 text-red-700 font-bold underline"
              >
                Thử lại ngay
              </button>
            </div>
          )}

          <div className="relative aspect-video bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-200">
            {step === 'LOCATION' && !error && (
              <div className="text-center p-6">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 font-bold">Đang quét vị trí GPS...</p>
                {currentDistance !== null && (
                  <p className="text-xs text-indigo-500 font-medium mt-2">Khoảng cách: {currentDistance}m</p>
                )}
              </div>
            )}

            {step === 'CAMERA' && (
              <>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline />
                <div className="absolute inset-0 border-8 border-white/20 rounded-3xl pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-56 border-2 border-white/80 rounded-full border-dashed pointer-events-none shadow-[0_0_0_1000px_rgba(0,0,0,0.3)]"></div>
              </>
            )}

            {step === 'PROCESSING' && (
              <div className="text-center p-4 bg-white/95 absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-800 font-bold">AI đang nhận diện...</p>
                <p className="text-xs text-slate-500 mt-1">Đang đối soát dữ liệu sinh trắc học.</p>
              </div>
            )}
            
            <canvas ref={canvasRef} width="400" height="300" className="hidden" />
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Đóng
            </button>
            {step === 'CAMERA' && (
              <button
                onClick={capturePhoto}
                className="flex-[2] py-4 px-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
              >
                Chụp ảnh & Xác nhận
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
