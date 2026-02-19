import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { apiGetMapData } from '../services/api';
import L from 'leaflet';

// Fix for default Leaflet icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons with improved URLs
const JobIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3050/3050159.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'job-marker-icon'
});

const InternIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/747/747376.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'intern-marker-icon'
});

export default function AdminMap() {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    apiGetMapData().then(setMarkers).catch(console.error);
  }, []);

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((item, idx) => (
          <Marker 
            key={idx} 
            position={[item.latitude, item.longitude]} 
            icon={item.type === 'job' ? JobIcon : InternIcon}
          >
            <Popup>
              <div className="text-sm">
                <span className={`font-bold ${item.type === 'job' ? 'text-red-600' : 'text-blue-600'}`}>
                    {item.type === 'job' ? 'Job Posting' : 'Student'}
                </span>
                <br />
                <strong>{item.type === 'job' ? item.title : item.name}</strong>
                <br />
                {item.city}
                {item.type === 'job' && <><br/><span className="text-xs text-slate-500">{item.company_name}</span></>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md z-1000 text-xs">
        <p className="font-bold text-slate-900 mb-2">Map Legend</p>
        <div className="flex items-center gap-2 mb-2">
            <img src="https://cdn-icons-png.flaticon.com/512/747/747376.png" className="h-5 w-5"/>
            <span className="text-slate-700">Student Location</span>
        </div>
        <div className="flex items-center gap-2">
            <img src="https://cdn-icons-png.flaticon.com/512/3050/3050159.png" className="h-5 w-5"/>
            <span className="text-slate-700">Job Opportunity</span>
        </div>
      </div>
    </div>
  );
}