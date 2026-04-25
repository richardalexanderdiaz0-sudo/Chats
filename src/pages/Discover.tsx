import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, setDoc, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { calculateDistance } from '../lib/utils';
import { UserPlus, Navigation, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

// Fix for Leaflet default icon issues in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const ChangeView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
};

const Discover: React.FC = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => doc.data())
        .filter(u => u.uid !== user?.uid);
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const requestLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation([latitude, longitude]);
        
        if (user) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              lastLocation: {
                lat: latitude,
                lng: longitude,
                updatedAt: new Date().toISOString()
              }
            });
          } catch (e) {
            console.error("Error updating location", e);
          }
        }
        setLocating(false);
      },
      (error) => {
        console.error("Location error", error);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleStartChat = async (otherUser: any) => {
    if (!user) return;
    
    const chatId = [user.uid, otherUser.uid].sort().join('_');
    const chatDocRef = doc(db, 'chats', chatId);
    
    // Check if chat already exists
    const chatSnap = await getDocs(query(collection(db, 'chats'), where('participants', 'array-contains', user.uid)));
    const existingChat = chatSnap.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(otherUser.uid);
    });

    if (!existingChat) {
      await setDoc(chatDocRef, {
        participants: [user.uid, otherUser.uid],
        updatedAt: serverTimestamp(),
        lastMessage: 'Chat iniciado'
      });
    }
    
    navigate(`/chats/${chatId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4 text-zinc-500">
        <Loader2 className="animate-spin" size={32} />
        <p className="font-bold tracking-widest text-xs uppercase">Buscando señales...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-black text-white">CONOCE</h2>
        <button 
          onClick={requestLocation}
          disabled={locating}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
        >
          {locating ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
          {location ? 'Actualizar' : 'Permitir Ubicación'}
        </button>
      </div>

      <div className="flex-1 min-h-[400px] relative">
        {!location ? (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center p-8 text-center">
            <div className="max-w-xs space-y-4">
              <MapPin className="mx-auto text-zinc-700" size={48} />
              <p className="text-zinc-500 text-sm font-medium">
                Necesitamos tu ubicación para mostrarte a personas cercanas.
              </p>
              <button 
                onClick={requestLocation}
                className="bg-white text-zinc-950 px-6 py-3 rounded-2xl font-bold w-full"
              >
                Habilitar GPS
              </button>
            </div>
          </div>
        ) : (
          <MapContainer 
            center={location} 
            zoom={13} 
            className="w-full h-full z-0 grayscale contrast-125"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={location} />
            <Marker position={location}>
              <Popup>
                <div className="text-zinc-950 font-bold">Tú estás aquí</div>
              </Popup>
            </Marker>

            {users.filter(u => u.lastLocation).map((u) => (
              <Marker key={u.uid} position={[u.lastLocation.lat, u.lastLocation.lng]}>
                <Popup>
                  <div className="p-2 space-y-3 min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full bg-zinc-200" />
                      <div>
                        <p className="font-black text-zinc-950 text-sm">{u.displayName}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                          A {calculateDistance(location[0], location[1], u.lastLocation.lat, u.lastLocation.lng)} KM
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleStartChat(u)}
                      className="w-full bg-zinc-950 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                    >
                      <UserPlus size={14} />
                      Conectar
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="p-6 bg-zinc-950">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Cerca de ti</h3>
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-zinc-600 text-sm italic">No hay nadie más por ahora...</p>
          ) : (
            users.map((u) => {
              const distance = location && u.lastLocation 
                ? calculateDistance(location[0], location[1], u.lastLocation.lat, u.lastLocation.lng)
                : null;
              
              return (
                <motion.div 
                  key={u.uid}
                  whileHover={{ scale: 1.02 }}
                  className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img src={u.photoURL} className="w-12 h-12 rounded-full ring-2 ring-zinc-800" alt="" />
                    <div>
                      <p className="font-bold text-white text-sm">{u.displayName}</p>
                      <p className="text-xs text-zinc-500 font-medium tracking-tight">
                        {distance !== null ? `${distance} km de distancia` : 'Ubicación desconocida'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStartChat(u)}
                    className="bg-white text-zinc-950 p-2 rounded-full hover:bg-zinc-200"
                  >
                    <UserPlus size={20} />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import { MapPin } from 'lucide-react';
export default Discover;
