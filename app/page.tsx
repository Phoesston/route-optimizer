"use client";

import { useEffect, useState } from "react";

type Job = {
  id: string;
  address: string;
  longitude: number | null;
  latitude: number | null;
  sequence: number | null;
  status: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [address, setAddress] = useState("");

  async function load(){
    const res = await fetch("/api/jobs");
    setJobs(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function addStop() {
    const geocodeRes = await fetch("/api/geocode", {
      method: "POST",
      body: JSON.stringify({ address }),
    }).then((r) => r.json());

    if(geocodeRes.error) return alert(geocodeRes.error);

    await fetch("/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        address,
        longitude: geocodeRes.longitude,
        latitude: geocodeRes.latitude,
      }),
    });
    setAddress("");
    load();
  }

  async function optimize() {
    const res = await fetch("/api/jobs/optimize", {
      method: "POST",
    }).then((r) => r.json());
    if (res.error) alert(res.error);
    load();
  }

  function navigate(job: Job) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `https://maps.apple.com/?daddr=${job.latitude},${job.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`;
    window.open(url, "_blank");
  }

  return (
    <main className="p-4 max-w-2xl mx-auto">

      <h1 className="text-xl font-semibold mb-4">Today's Route</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Add a stop"
          className="flex=1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={addStop}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
        >
          Add Stop
        </button>

        <button
          onClick={optimize}
          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
        >
          Optimize Route
        </button>

        <ol className="space-y-2">  
          {jobs.map((job) => (
            <li key={job.id} className="border rounded-lg p-2 flex justify-between items-center">
              <span>
                {job.sequence !== null ? `${job.sequence}. ` : ""}
                {job.address}
              </span>

              <button
                onClick={() => navigate(job)}
                className="bg-blue-500 text-white px-2 py-1 rounded-lg text-sm"
              >
                Navigate
              </button>
            </li>
          ))}
        </ol>

      </div>
    </main>
  );
}