// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/hostelhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('MongoDB connection error:', error));

// Middleware
app.use(express.json());
app.use(cors());

// Hostel Model
const hostelSchema = new mongoose.Schema({
  name: String,
  type: String,
  rooms: [{
    type: String,
    status: String,
    roomNo: String,
    bookedBy: {
      name: String,
      enrollmentNumber: String
    }
  }]
});

const Hostel = mongoose.model('Hostel', hostelSchema);

// Routes
app.get('/api/hostels/:hostelType/:roomType', async (req, res) => {
  const { hostelType, roomType } = req.params;

  try {
    const hostels = await Hostel.find({ type: hostelType }).lean();
    const rooms = hostels.reduce((acc, hostel) => {
      const filteredRooms = hostel.rooms.filter(room => room.type === roomType && (room.status === 'Completely Empty' || room.status === 'Partially Occupied'));
      acc.push(...filteredRooms);
      return acc;
    }, []);
    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching hostels', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/book-hostel', async (req, res) => {
  const { hostelName, roomNo, name, enrollmentNumber } = req.body;

  try {
    const hostel = await Hostel.findOne({ name: hostelName });
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    const room = hostel.rooms.find(room => room.roomNo === roomNo);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'Completely Empty') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    room.status = 'Partially Occupied';
    room.bookedBy = { name, enrollmentNumber };
    await hostel.save();

    res.json({ message: 'Hostel room booked successfully' });
  } catch (error) {
    console.error('Error booking hostel room', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
