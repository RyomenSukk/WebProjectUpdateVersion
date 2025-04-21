import { useEffect, useState } from "react";
// ต้องแน่ใจว่าได้มีการ import global.css ในไฟล์ที่เหมาะสม
// เช่น ใน _app.js หรือ layout.js ด้วยคำสั่ง import '../styles/global.css';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playingFromPlaylist, setPlayingFromPlaylist] = useState(false);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/songs");
        if (!res.ok) {
          throw new Error("Failed to fetch songs");
        }
        const data = await res.json();
        setSongs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // โหลดเพลย์ลิสต์ที่บันทึก (ถ้ามี)
    const savedPlaylist = localStorage.getItem("musicPlaylist");
    if (savedPlaylist) {
      try {
        setPlaylist(JSON.parse(savedPlaylist));
      } catch (e) {
        console.error("Error loading saved playlist", e);
      }
    }

    fetchSongs();
  }, []);

  // บันทึกเพลย์ลิสต์ลงใน localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem("musicPlaylist", JSON.stringify(playlist));
    }
  }, [playlist]);

  // Extract YouTube ID from a full URL
  const getYoutubeId = (url) => {
    if (!url) return null;
    
    // If it's already just an ID
    if (!url.includes("http") && url.length > 5) {
      return url;
    }
    
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      } else if (urlObj.hostname.includes("youtu.be")) {
        return urlObj.pathname.substring(1);
      }
    } catch (e) {
      return null;
    }
    
    return null;
  };

  const getThumbnailUrl = (youtubeId) => {
    if (!youtubeId) return "/api/placeholder/320/180";
    return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
  };

  const playSong = (youtubeUrl) => {
    const youtubeId = getYoutubeId(youtubeUrl);
    if (youtubeId) {
      setActiveVideo(youtubeId);
      setPlayingFromPlaylist(false);
      setCurrentPlaylistIndex(-1);
    } else {
      alert("ไม่พบลิงก์ YouTube สำหรับเพลงนี้");
    }
  };

  // ฟังก์ชันสำหรับช่วยหาข้อมูลเพลงที่กำลังเล่น
  const getActiveSong = () => {
    if (!activeVideo || (!Array.isArray(songs) && !playlist.length)) return null;
    
    // ค้นหาในรายการเพลงปกติก่อน
    if (Array.isArray(songs)) {
      const fromSongs = songs.find(song => getYoutubeId(song.youtube_url) === activeVideo);
      if (fromSongs) return fromSongs;
    }
    
    // ถ้าไม่พบในรายการเพลงปกติ ให้ค้นหาในเพลย์ลิสต์
    return playlist.find(song => getYoutubeId(song.youtube_url) === activeVideo);
  };

  const activeSong = getActiveSong();

  // เพิ่มเพลงลงในเพลย์ลิสต์
  const addToPlaylist = (song) => {
    // ตรวจสอบว่าเพลงอยู่ในเพลย์ลิสต์แล้วหรือไม่
    const songExists = playlist.some(
      item => getYoutubeId(item.youtube_url) === getYoutubeId(song.youtube_url)
    );
    
    if (!songExists) {
      const newPlaylist = [...playlist, song];
      setPlaylist(newPlaylist);
      alert(`เพิ่ม "${song.title}" ลงในเพลย์ลิสต์แล้ว`);
    } else {
      alert("เพลงนี้อยู่ในเพลย์ลิสต์แล้ว");
    }
  };

  // ลบเพลงออกจากเพลย์ลิสต์
  const removeFromPlaylist = (index) => {
    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 1);
    setPlaylist(newPlaylist);
    
    // ถ้ากำลังเล่นเพลงจากเพลย์ลิสต์และลบเพลงที่กำลังเล่นอยู่
    if (playingFromPlaylist && index === currentPlaylistIndex) {
      if (newPlaylist.length > 0) {
        // ถ้ายังมีเพลงในเพลย์ลิสต์ ให้เล่นเพลงถัดไป
        const nextIndex = index < newPlaylist.length ? index : 0;
        playPlaylistSong(nextIndex);
      } else {
        // ถ้าไม่มีเพลงในเพลย์ลิสต์แล้ว ให้หยุดเล่น
        setActiveVideo(null);
        setPlayingFromPlaylist(false);
        setCurrentPlaylistIndex(-1);
      }
    } else if (playingFromPlaylist && index < currentPlaylistIndex) {
      // ถ้าลบเพลงที่อยู่ก่อนเพลงที่กำลังเล่น ปรับ index
      setCurrentPlaylistIndex(currentPlaylistIndex - 1);
    }
  };

  // ล้างเพลย์ลิสต์ทั้งหมด
  const clearPlaylist = () => {
    if (confirm("คุณต้องการล้างเพลย์ลิสต์ทั้งหมดหรือไม่?")) {
      setPlaylist([]);
      localStorage.removeItem("musicPlaylist");
      
      if (playingFromPlaylist) {
        setActiveVideo(null);
        setPlayingFromPlaylist(false);
        setCurrentPlaylistIndex(-1);
      }
    }
  };

  // เล่นเพลงจากเพลย์ลิสต์
  const playPlaylistSong = (index) => {
    if (index >= 0 && index < playlist.length) {
      const song = playlist[index];
      const youtubeId = getYoutubeId(song.youtube_url);
      if (youtubeId) {
        setActiveVideo(youtubeId);
        setPlayingFromPlaylist(true);
        setCurrentPlaylistIndex(index);
      }
    }
  };

  // เล่นเพลงถัดไปในเพลย์ลิสต์
  const playNextSong = () => {
    if (!playingFromPlaylist || playlist.length === 0) return;
    
    const nextIndex = (currentPlaylistIndex + 1) % playlist.length;
    playPlaylistSong(nextIndex);
  };

  // เล่นเพลงก่อนหน้าในเพลย์ลิสต์
  const playPreviousSong = () => {
    if (!playingFromPlaylist || playlist.length === 0) return;
    
    const prevIndex = (currentPlaylistIndex - 1 + playlist.length) % playlist.length;
    playPlaylistSong(prevIndex);
  };

  // เล่นเพลย์ลิสต์แบบสุ่ม
  const shufflePlaylist = () => {
    if (playlist.length <= 1) {
      alert("ต้องมีเพลงในเพลย์ลิสต์อย่างน้อย 2 เพลง");
      return;
    }
    
    // สุ่มเลือกเพลงที่ไม่ใช่เพลงปัจจุบัน
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * playlist.length);
    } while (randomIndex === currentPlaylistIndex && playlist.length > 1);
    
    playPlaylistSong(randomIndex);
  };

  // จัดการเมื่อวิดีโอจบการเล่น
  const handleVideoEnded = () => {
    if (playingFromPlaylist) {
      playNextSong();
    }
  };

  return (
    <div className="container">
      <h1>Music Library</h1>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* ปุ่มสลับระหว่างรายการเพลงและเพลย์ลิสต์ */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${!showPlaylist ? 'active' : ''}`}
              onClick={() => setShowPlaylist(false)}
            >
              รายการเพลงทั้งหมด
            </button>
            <button 
              className={`toggle-btn ${showPlaylist ? 'active' : ''}`}
              onClick={() => setShowPlaylist(true)}
            >
              เพลย์ลิสต์ของฉัน {playlist.length > 0 && `(${playlist.length})`}
            </button>
          </div>
          
          <div className="horizontal-layout">
            {/* ส่วนแสดงคลิปขนาดใหญ่ด้านขวา */}
            <div className="main-player-area">
              {activeVideo ? (
                <div className="active-player">
                  <h2 className="now-playing">{activeSong?.title} - {activeSong?.artist}</h2>
                  <div className="video-wrapper">
                    <iframe 
                      src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onEnded={handleVideoEnded}
                    ></iframe>
                  </div>
                  <div className="active-player-controls">
                    {playingFromPlaylist && (
                      <>
                        <button onClick={playPreviousSong} className="playlist-control-btn">
                          ⏮️ ก่อนหน้า
                        </button>
                        <button onClick={playNextSong} className="playlist-control-btn">
                          ถัดไป ⏭️
                        </button>
                      </>
                    )}
                    <button onClick={() => setActiveVideo(null)}>
                      ปิดเครื่องเล่น
                    </button>
                    {playingFromPlaylist && (
                      <button onClick={shufflePlaylist} className="playlist-control-btn">
                        🔀 สุ่มเพลง
                      </button>
                    )}
                    {activeSong?.chord_url && (
                      <button onClick={() => window.open(activeSong.chord_url, "_blank")}>
                        ดูคอร์ด
                      </button>
                    )}
                    {!playingFromPlaylist && activeSong && (
                      <button 
                        onClick={() => addToPlaylist(activeSong)}
                        className="add-to-playlist-btn"
                      >
                        + เพิ่มในเพลย์ลิสต์
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-player">
                  <p>เลือกเพลงที่ต้องการเล่นจากรายการด้านซ้าย</p>
                </div>
              )}
            </div>
            
            {/* ส่วนแสดงรายการเพลงด้านซ้าย */}
            <div className="playlist-container">
              {showPlaylist ? (
                <>
                  <div className="playlist-header">
                    <h3 className="playlist-title">เพลย์ลิสต์ของฉัน</h3>
                    {playlist.length > 0 && (
                      <div className="playlist-actions">
                        <button 
                          onClick={() => playPlaylistSong(0)}
                          className="play-all-btn"
                          disabled={playlist.length === 0}
                        >
                          ▶️ เล่นทั้งหมด
                        </button>
                        <button 
                          onClick={clearPlaylist}
                          className="clear-btn"
                          disabled={playlist.length === 0}
                        >
                          🗑️ ล้างเพลย์ลิสต์
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="song-list">
                    {playlist.length > 0 ? (
                      playlist.map((song, index) => {
                        const youtubeId = getYoutubeId(song.youtube_url);
                        const isActive = playingFromPlaylist && currentPlaylistIndex === index;
                        
                        return (
                          <div 
                            key={`playlist-${index}`} 
                            className={`song-item playlist-item ${isActive ? 'active-song' : ''}`}
                          >
                            <div 
                              className="song-content"
                              onClick={() => playPlaylistSong(index)}
                            >
                              <div className="song-thumbnail-small">
                                <img 
                                  src={getThumbnailUrl(youtubeId)} 
                                  alt={`${song.title} thumbnail`}
                                />
                                <div className="thumbnail-overlay">
                                  <div className="play-icon">
                                    <svg viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="song-info">
                                <h4 className="song-title">{song.title}</h4>
                                <p className="song-artist">{song.artist}</p>
                              </div>
                            </div>
                            <div className="playlist-item-actions">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromPlaylist(index);
                                }}
                                className="remove-btn"
                                title="นำออกจากเพลย์ลิสต์"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-playlist">
                        <p>เพลย์ลิสต์ของคุณว่างเปล่า</p>
                        <p>เพิ่มเพลงโดยกดปุ่ม "เพิ่มในเพลย์ลิสต์" ขณะเล่นเพลง</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="playlist-title">รายการเพลงทั้งหมด</h3>
                  <div className="song-list">
                    {Array.isArray(songs) && songs.length > 0 ? (
                      songs.map((song) => {
                        const youtubeId = getYoutubeId(song.youtube_url);
                        const isActive = !playingFromPlaylist && activeVideo === youtubeId;
                        
                        return (
                          <div 
                            key={song.id} 
                            className={`song-item ${isActive ? 'active-song' : ''}`}
                          >
                            <div 
                              className="song-content" 
                              onClick={() => playSong(song.youtube_url)}
                            >
                              <div className="song-thumbnail-small">
                                <img 
                                  src={getThumbnailUrl(youtubeId)} 
                                  alt={`${song.title} thumbnail`}
                                />
                                <div className="thumbnail-overlay">
                                  <div className="play-icon">
                                    <svg viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="song-info">
                                <h4 className="song-title">{song.title}</h4>
                                <p className="song-artist">{song.artist}</p>
                              </div>
                            </div>
                            <div className="song-item-actions">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToPlaylist(song);
                                }}
                                className="add-btn"
                                title="เพิ่มในเพลย์ลิสต์"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="no-songs">ไม่พบเพลงในระบบ</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}