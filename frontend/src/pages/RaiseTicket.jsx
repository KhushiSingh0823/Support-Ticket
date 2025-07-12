import React, { useState } from "react";
import { Headset, FileImage, CheckCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RaiseTicket = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({ issue: "", screenshot: null });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "screenshot") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, screenshot: file }));

      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeScreenshot = () => {
    setFormData({ ...formData, screenshot: null });
    setPreviewUrl(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append("issue", formData.issue);
      if (formData.screenshot) {
        data.append("screenshot", formData.screenshot, formData.screenshot.name); // ✅ FIXED
      }

      //const res = await fetch("http://localhost:5000/api/tickets",
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets`, {
        method: "POST",
        body: data,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTicketCreated(true);
        setFormData({ issue: "", screenshot: null });
        setPreviewUrl(null);
      } else {
        const error = await res.json();
        alert("Error: " + (error.error || "Failed to submit ticket"));
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit ticket.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
      <div className="max-w-2xl mx-auto glass-container p-8 rounded-2xl shadow-lg w-full">
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Headset size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-indigo-800">Raise a Ticket</h1>
          <p className="text-gray-600">We're here to help! Please fill out the form below.</p>
        </div>

        {ticketCreated ? (
          <div className="flex flex-col items-center justify-center text-green-600 mb-6">
            <CheckCircle size={40} />
            <h2 className="text-2xl font-bold">Your ticket has been created!</h2>
            <p className="text-gray-600">Thank you for reaching out to us.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <textarea
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              required
              placeholder="Describe your issue"
              className="w-full p-3 border border-indigo-300 rounded-lg"
              rows="4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Screenshot (Optional)
            </label>
            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-300 rounded-lg relative">
              <input
                type="file"
                name="screenshot"
                onChange={handleChange}
                accept="image/*"
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <FileImage size={32} className="text-indigo-600 mb-2" />
                <p className="text-gray-500">
                  {formData.screenshot ? formData.screenshot.name : "Click to upload screenshot"}
                </p>
              </div>
            </div>

            {formData.screenshot && (
              <div className="mt-4 p-4 bg-white border border-indigo-200 rounded-lg shadow-sm flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-3">
                  <FileImage className="text-indigo-500" />
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="text-sm font-medium text-indigo-700 hover:underline"
                    >
                      {formData.screenshot.name}
                    </button>
                    <p className="text-xs text-gray-500">
                      {(formData.screenshot.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg shadow hover:shadow-md transition"
            >
              Submit Ticket
            </button>
          </form>
        )}
      </div>

      {showModal && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white p-6 rounded-xl shadow-xl max-w-md w-full animate-fadeInUp">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
            >
              <X size={24} />
            </button>
            <img src={previewUrl} alt="Screenshot" className="rounded-md max-h-[60vh] w-auto mx-auto" />
          </div>
        </div>
      )}

      <style>{`
        .glass-container {
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          background-color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(209, 213, 219, 0.5);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.35s ease-out; }
      `}</style>
    </div>
  );
};

export default RaiseTicket;
