import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParkingSlots } from "@/hooks/useParkingSlots";

const AdminDashboard = () => {
  const { stats, loading } = useParkingSlots();

  return (
    <div className="container py-4 sm:py-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Control Panel</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Camera 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-gray-100">
              <img
                src={`${import.meta.env.VITE_API_URL || '/api'}/video_feed`}
                alt="Camera 1 Feed"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<p class="text-white text-sm">Camera 1 Offline</p>';
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Camera 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-gray-100">
              <img
                src={`${import.meta.env.VITE_API_URL || '/api'}/video_feed_2`}
                alt="Camera 2 Feed"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<p class="text-white text-sm">Camera 2 Offline</p>';
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading stats...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 text-center">
                <div className="p-3 sm:p-4 bg-gray-100 rounded-lg">
                  <h3 className="text-sm sm:text-xl font-bold text-gray-600">Total</h3>
                  <p className="text-2xl sm:text-4xl font-extrabold">{stats.total}</p>
                </div>
                <div className="p-3 sm:p-4 bg-green-100 rounded-lg">
                  <h3 className="text-sm sm:text-xl font-bold text-green-600">Avail</h3>
                  <p className="text-2xl sm:text-4xl font-extrabold text-green-700">{stats.available}</p>
                </div>
                <div className="p-3 sm:p-4 bg-red-100 rounded-lg">
                  <h3 className="text-sm sm:text-xl font-bold text-red-600">Taken</h3>
                  <p className="text-2xl sm:text-4xl font-extrabold text-red-700">{stats.occupied}</p>
                </div>
                <div className="p-3 sm:p-4 bg-blue-100 rounded-lg">
                  <h3 className="text-sm sm:text-xl font-bold text-blue-600">Booked</h3>
                  <p className="text-2xl sm:text-4xl font-extrabold text-blue-700">{stats.booked}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
