const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ideaRoutes = require('./routes/ideaRoutes');

const app = express();
mongoose.connection.once('open', () => {
  console.log("Connected to DB:", mongoose.connection.name);
});


app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Mongo Connected"))
.catch(err => console.log(err));

app.use('/api/ideas', ideaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

