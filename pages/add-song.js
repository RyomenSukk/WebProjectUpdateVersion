import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function AddSongPage() {
  const router = useRouter();
  const [songs, setSongs] = useState([]); // To store the list of songs
  const [deleteTitle, setDeleteTitle] = useState('');

  // Fetch the list of songs when the component mounts
  useEffect(() => {
    async function fetchSongs() {
      try {
        const res = await fetch('/api/add-song', { method: 'GET' });
        const data = await res.json();
        if (res.ok) {
          setSongs(data.songs); // Set the list of songs
        } else {
          console.error('Failed to fetch songs:', data.error);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    }

    fetchSongs();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const title = form.title.value;
    const artist = form.artist.value;
    const youtube_url = form.youtube_url.value;
    const chord_url = form.chord_url.value;

    try {
      const res = await fetch('/api/add-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, youtube_url, chord_url }),
      });

      const result = await res.json();
      if (res.ok) {
        alert('เพิ่มเพลงสำเร็จ');
        form.reset();
        setSongs((prevSongs) => [...prevSongs, { title }]); // Add the new song to the list
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();

    if (!deleteTitle) {
      alert('กรุณาเลือกชื่อเพลงที่ต้องการลบ');
      return;
    }

    try {
      const res = await fetch('/api/add-song', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: deleteTitle }),
      });

      const result = await res.json();
      if (res.ok) {
        alert('ลบเพลงสำเร็จ');
        setDeleteTitle(''); // Reset the selected song
        setSongs((prevSongs) => prevSongs.filter((song) => song.title !== deleteTitle)); // Update the song list
      } else {
        alert(result.error || 'เกิดข้อผิดพลาดในการลบเพลง');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  }

  function goBackToIndex() {
    router.push('/');
  }

  return (
    <div className="form-container">
      <h2>เพิ่มเพลง</h2>
      <form onSubmit={handleSubmit} className="song-form">
        <input name="title" placeholder="ชื่อเพลง" required />
        <input name="artist" placeholder="ศิลปิน" required />
        <input name="youtube_url" placeholder="YouTube URL" required />
        <input name="chord_url" placeholder="Chord URL" />

        <button type="submit">เพิ่มเพลง</button>
      </form>

      <h2>ลบเพลง</h2>
      <form onSubmit={handleDelete} className="delete-form">
        <select
          value={deleteTitle}
          onChange={(e) => setDeleteTitle(e.target.value)}
          required
        >
          <option value="">เลือกชื่อเพลง</option>
          {songs.map((song, index) => (
            <option key={index} value={song.title}>
              {song.title}
            </option>
          ))}
        </select>
        <button type="submit" className="delete-button">
          ลบเพลง
        </button>
      </form>

      <button className="back-button" onClick={goBackToIndex}>
        กลับไปหน้าแรก
      </button>
    </div>
  );
}