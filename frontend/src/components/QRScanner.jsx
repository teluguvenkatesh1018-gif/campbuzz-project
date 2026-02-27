import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { attendanceAPI } from '../services/api';
import { toast } from 'react-toastify';

const QRScanner = ({ event, onScanComplete, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning && scannerRef.current) {
      startScanner();
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => {
          console.error('Failed to clear scanner:', error);
        });
      }
    };
  }, [scanning]);

  const startScanner = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [0, 1] // QR_CODE only
      },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => onQRCodeScanned(decodedText),
      (error) => {
        // Optional: Handle scan errors
        console.log('QR Scan error:', error);
      }
    );

    setScanner(html5QrcodeScanner);
  };

  const onQRCodeScanned = async (decodedText) => {
    try {
      setScanning(false);
      
      // Parse QR data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (error) {
        toast.error('Invalid QR code format');
        return;
      }

      // Validate QR data
      if (qrData.type !== 'attendance' || qrData.eventId !== event._id) {
        toast.error('This QR code is not valid for this event');
        return;
      }

      // Mark attendance
      const response = await attendanceAPI.scanAttendance(event._id, { qrData: decodedText });
      
      toast.success(response.data.message);
      
      if (onScanComplete) {
        onScanComplete(response.data);
      }

      // Close scanner after successful scan
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Scan error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to process QR code');
      }
      
      // Restart scanner on error
      setScanning(true);
    }
  };

  const toggleScanner = () => {
    setScanning(!scanning);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">QR Code Scanner</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="text-center mb-4">
        <p className="text-gray-600 mb-2">Scan event QR code to mark attendance</p>
        <p className="text-sm text-gray-500">Event: <strong>{event.title}</strong></p>
      </div>

      {!scanning ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📱</div>
          <button
            onClick={toggleScanner}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
          >
            Start Scanner
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Make sure camera permissions are enabled
          </p>
        </div>
      ) : (
        <div>
          <div id="qr-reader" className="mb-4"></div>
          <button
            onClick={toggleScanner}
            className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            Stop Scanner
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">How to use:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Click "Start Scanner"</li>
          <li>2. Allow camera access</li>
          <li>3. Point camera at QR code</li>
          <li>4. Wait for automatic scan</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;