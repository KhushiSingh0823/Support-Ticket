import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { CheckCircle } from "lucide-react";

function TicketForm({ onTicketRaised }) {
  const { user, token } = useAuth();
  const [issue, setIssue] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setScreenshot(file);

    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("issue", issue);
    formData.append("screenshot", screenshot);

    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/tickets", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Ticket raised successfully");
      setIssue("");
      setScreenshot(null);
      setPreviewUrl(null);
      if (onTicketRaised) onTicketRaised();
    } catch (err) {
      alert("Error raising ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">Issue</label>
        <textarea
          className="w-full mt-1 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Describe your issue"
          rows={4}
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          required
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Screenshot
        </label>
        <input
          type="file"
          accept="image/*"
          className="mt-1"
          onChange={handleFileChange}
          required
        />

        {/* File Preview or Name */}
        {screenshot && (
          <div className="mt-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded Preview"
                className="w-40 h-auto rounded-md shadow border"
              />
            ) : (
              <div className="flex items-center gap-2 text-green-600 mt-1">
                <CheckCircle size={20} />
                <span>{screenshot.name}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>
      </div>
    </form>
  );
}

export default TicketForm;
