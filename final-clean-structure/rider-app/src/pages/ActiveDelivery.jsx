import { useEffect, useState } from "react";
import socket from "../services/socket.js";
import RouteMap from "../components/rider/RouteMap.jsx";
import { toast } from "../utils/toast.js";

export default function ActiveDelivery() {
  const [location, setLocation] = useState({ lat:32.101, lng:74.873 });

  useEffect(() => {
    socket.connect();
    const interval = setInterval(() => {
      setLocation(prev => {
        const next = { lat:Number((prev.lat + .001).toFixed(4)), lng:Number((prev.lng + .001).toFixed(4)) };
        socket.emit("rider-location-update", { riderId:"demo-rider", location:next });
        return next;
      });
    }, 5000);
    return () => { clearInterval(interval); socket.disconnect(); };
  }, []);

  return <section className="page"><div className="container"><h1>Active Delivery</h1><div className="grid grid-2"><div className="card"><span className="badge">Live Tracking</span><h2>Current Location</h2><p>Lat: {location.lat}</p><p>Lng: {location.lng}</p><button className="btn" onClick={()=>toast.success("Order marked as picked")}>Mark Picked</button>{" "}<button className="btn outline" onClick={()=>toast.success("Go to OTP verification before completing delivery")}>Mark Delivered</button></div><RouteMap/></div></div></section>;
}
