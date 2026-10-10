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

type AddressSuggestion = {
  id: string;
  address: string;
};


export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

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

  useEffect(() => {

    const query = address.trim();

    if(address.trim().length < 3 || selectedAddress !== null) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try{
        const response = await fetch(
          `/api/address-suggestions?q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await response.json();

        if(!response.ok){
          throw new Error(data.error || "Unable to search addresses.");
        }

        if(!controller.signal.aborted){
          setSuggestions(data.suggestions);
        }
      } catch(error){
        if(controller.signal.aborted) return;

        console.error("Address search failed:", error);
      }
    }, 300);

    return () => {
      clearTimeout(timer)
      controller.abort();
    };
  }, [address, selectedAddress]);

  function selectAddress(suggestion: AddressSuggestion){
    setAddress(suggestion.address);
    setSelectedAddress(suggestion);
    setSuggestions([])
  }

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
    setSelectedAddress(null);
    setSuggestions([]);
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

  type CurrentLocation = {
    longitude : number;
    latitude  : number;
  }
  
  function getCurrentLocation() : Promise<CurrentLocation>{
    return new Promise((resolve, reject) => {
      if(!navigator.geolocation){
        reject(new Error('Location access is unavailable in this browser'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          });
        },
        (error) => {
                const message =
                    error.code === 1
                        ? "Allow location access to optimize from your position."
                        : error.code === 3
                          ? "Finding your location timed out. Please retry."
                          : "Unable to determine your location.";

                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10_000,
                maximumAge: 0,
            },
      );
    });
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
        <div className="relative min-w-0 flex-1">
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setSelectedAddress(null);
              setSuggestions([]);
            }}
            aria-label="Stop address"
            autoComplete= "off"
            placeholder="Add a stop"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          {suggestions.length > 0 && (
            <div className="absolute top-full z-10 mt-1 w-full rounded-lg border bg-white text-gray-900 shadow-lg">
              <ul aria-label="Address suggestions">
                {suggestions.map((suggestion) => (
                  <li key = {suggestion.id} className="px-3 py-2 text-sm">
                    <button
                      type="button"
                      onClick={() => selectAddress(suggestion)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50"
                    >
                      {suggestion.address}
                    </button>
                    
                  </li>
                ))}
              </ul>

              <p className="px-3 py-1 text-xs text-gray-500">
                © Mapbox
              </p>
        </div>
        )}
      </div>
        

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
