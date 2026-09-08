"use client";

import { useEffect, useState } from "react";
import {signOut} from "next-auth/react";


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
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/jobs");
      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String(data.error)
            : "Unable to load jobs.";
        throw new Error(message);
      }

      if (!Array.isArray(data)) {
        throw new Error("The jobs API returned an invalid response.");
      }

      setJobs(data as Job[]);
      setError(null);
    } catch (err) {
      setJobs([]);
      setError(err instanceof Error ? err.message : "Unable to load jobs.");
    }
  }

  useEffect(() => {
    // `load` only updates state after its fetch has completed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
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

  async function deleteStop(id: string) {
    if(deletingId !== null) return; // Prevent multiple deletions at once

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Unable to delete job");
      }

    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete job.");
    } finally {
      setDeletingId(null);
    }
  }

  async function optimize() {
    const res = await fetch("/api/optimize", {
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

      <h1 className="text-xl font-semibold mb-4">Today&apos;s Route</h1>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mb-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
      >
        Sign Out
      </button>

      <div className="flex gap-2 mb-4">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Add a stop"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
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

      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

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

            <button
              type="button"
              onClick = {() => deleteStop(job.id)}
              disabled = {deletingId !== null}
              aria-label = {`Delete stop: ${job.address}`}
              className="bg-red-600 text-white px-2 py-1 rounded-lg text-sm disabled:opacity-50"
            > Delete </button>
          </li>
        ))}
      </ol>
    </main>
  );
}
