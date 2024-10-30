const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/sparql', async (req, res) => {
    const { query } = req.body;
    console.log('Received SPARQL query:', query.trim());

    try {
    const response = await axios.get(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=xml`)
      // , {
        //     params: {
        //     query: `${encodeURIComponent(query)}`,
        //         format: 'xml'
        //     }
        // });

        console.log('SPARQL response:', JSON.stringify(response.data, null, 2));

        res.json(response.data);
    } catch (error) {
        console.error('Error during SPARQL request:', error.response.data || error.message);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
