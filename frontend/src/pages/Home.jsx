import { useNavigate } from "react-router-dom";
import { MdPerson, MdAdminPanelSettings } from "react-icons/md";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 px-4 py-12 relative flex flex-col items-center justify-center">
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-8 text-center">
        Welcome to the Support Ticket System
      </h1>
      <p className="text-lg md:text-xl text-gray-700 mb-14 text-center max-w-2xl">
        This platform allows users to raise support tickets and enables the support team to respond, track, and resolve them efficiently.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {/* User Card */}
        <div
          onClick={() => navigate("/customerLogin")}
          className="cursor-pointer bg-white rounded-2xl shadow-xl transition-transform transform hover:scale-105 hover:shadow-2xl p-10 flex flex-col items-center text-center min-h-[300px]"
        >
          <div className="bg-blue-100 p-5 rounded-full mb-6">
            <MdPerson className="text-6xl text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-blue-600 mb-3">User Portal</h2>
          <p className="text-gray-600 mb-5">
            Raise tickets, check status, and chat with support.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition duration-300">
            Go to User Login
          </button>
        </div>

        {/* Admin Card */}
        <div
          onClick={() => navigate("/adminLogin")}
          className="cursor-pointer bg-white rounded-2xl shadow-xl transition-transform transform hover:scale-105 hover:shadow-2xl p-10 flex flex-col items-center text-center min-h-[300px]"
        >
          <div className="bg-purple-100 p-5 rounded-full mb-6">
            <MdAdminPanelSettings className="text-6xl text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-purple-600 mb-3">Admin Console</h2>
          <p className="text-gray-600 mb-5">
            View all tickets, respond, and update their status.
          </p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition duration-300">
            Go to Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
