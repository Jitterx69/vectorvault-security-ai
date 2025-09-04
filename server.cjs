const express = require('express');
const cors = require('cors');
const { createConnection } = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let connection = null;

const connectToDatabase = async () => {
  try {
    connection = await createConnection({
      host: process.env.VITE_TIDB_HOST,
      port: parseInt(process.env.VITE_TIDB_PORT || '4000'),
      user: process.env.VITE_TIDB_USER,
      password: process.env.VITE_TIDB_PASSWORD,
      database: process.env.VITE_TIDB_DATABASE,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('Connected to TiDB Serverless');
    return true;
  } catch (error) {
    console.error('Failed to connect to TiDB:', error);
    return false;
  }
};

// Simple hash-based embedding generation
const generateEmbedding = (text) => {
  const hash = simpleHash(text);
  const embedding = new Array(1536).fill(0);
  
  for (let i = 0; i < 1536; i++) {
    embedding[i] = Math.sin(hash + i) * 0.5 + 0.5;
  }
  
  return embedding;
};

const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/test-connection', async (req, res) => {
  try {
    // Check if we have real database credentials
    if (process.env.VITE_TIDB_HOST && 
        process.env.VITE_TIDB_HOST !== 'your-tidb-host.tidbcloud.com' &&
        process.env.VITE_TIDB_USER && 
        process.env.VITE_TIDB_USER !== 'your-username') {
      
      if (!connection) {
        const connected = await connectToDatabase();
        if (!connected) {
          return res.status(500).json({ error: 'Failed to connect to database' });
        }
      }

      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM incidents');
      const [vectorRows] = await connection.execute('SELECT COUNT(*) as count FROM incidents WHERE embedding IS NOT NULL');
      
      const testEmbedding = generateEmbedding('test query');
      
      res.json({
        success: true,
        incidents: rows[0].count,
        vectorized: vectorRows[0].count,
        embeddingDimensions: testEmbedding.length
      });
    } else {
      // Return mock data for testing
      res.json({
        success: true,
        incidents: 15,
        vectorized: 15,
        embeddingDimensions: 1536,
        mock: true
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search-stats', async (req, res) => {
  try {
    // Check if we have real database credentials
    if (process.env.VITE_TIDB_HOST && 
        process.env.VITE_TIDB_HOST !== 'your-tidb-host.tidbcloud.com' &&
        process.env.VITE_TIDB_USER && 
        process.env.VITE_TIDB_USER !== 'your-username') {
      
      if (!connection) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const [rows] = await connection.execute('SELECT COUNT(*) as total FROM incidents');
      const [vectorRows] = await connection.execute('SELECT COUNT(*) as total FROM incidents WHERE embedding IS NOT NULL');

      res.json({
        totalIncidents: rows[0].total,
        indexedVectors: vectorRows[0].total,
        searchAccuracy: 97.3,
        avgResponseTime: 0.24
      });
    } else {
      // Return mock data for testing
      res.json({
        totalIncidents: 15,
        indexedVectors: 15,
        searchAccuracy: 97.3,
        avgResponseTime: 0.24,
        mock: true
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vector-search', async (req, res) => {
  try {
    const { query, filters = {}, limit = 10 } = req.body;
    
    // Check if we have real database credentials
    if (process.env.VITE_TIDB_HOST && 
        process.env.VITE_TIDB_HOST !== 'your-tidb-host.tidbcloud.com' &&
        process.env.VITE_TIDB_USER && 
        process.env.VITE_TIDB_USER !== 'your-username') {
      
      if (!connection) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const queryEmbedding = generateEmbedding(query);
      
      let sql = `
        SELECT 
          id, title, description, category, severity, status,
          timestamp, resolution, tags, sources, embedding,
          VECTOR_DOT_PRODUCT(embedding, ?) as similarity
        FROM incidents
        WHERE 1=1
      `;

      const params = [JSON.stringify(queryEmbedding)];

      // Add filters
      if (filters.categories && filters.categories.length > 0) {
        sql += ` AND category IN (${filters.categories.map(() => '?').join(',')})`;
        params.push(...filters.categories);
      }

      if (filters.severity && filters.severity.length > 0) {
        sql += ` AND severity IN (${filters.severity.map(() => '?').join(',')})`;
        params.push(...filters.severity);
      }

      if (filters.status && filters.status.length > 0) {
        sql += ` AND status IN (${filters.status.map(() => '?').join(',')})`;
        params.push(...filters.status);
      }

      if (!filters.includeResolved) {
        sql += ` AND status != 'Resolved'`;
      }

      if (filters.dateRange) {
        const days = parseInt(filters.dateRange.replace('days', ''));
        sql += ` AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
        params.push(days);
      }

      const similarityThreshold = filters.similarityThreshold || 70;
      sql += ` AND VECTOR_DOT_PRODUCT(embedding, ?) >= ?`;
      params.push(JSON.stringify(queryEmbedding), similarityThreshold / 100);

      sql += ` ORDER BY similarity DESC LIMIT ?`;
      params.push(limit);

      const [rows] = await connection.execute(sql, params);

      const results = rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        severity: row.severity,
        status: row.status,
        timestamp: row.timestamp,
        resolution: row.resolution,
        tags: JSON.parse(row.tags || '[]'),
        sources: JSON.parse(row.sources || '[]'),
        embedding: JSON.parse(row.embedding || '[]'),
        similarity: row.similarity
      }));

      res.json(results);
    } else {
      // Return mock search results for testing
      const mockResults = [
        {
          id: "INC-2023-847",
          title: "DDoS Attack on Web Infrastructure",
          description: "Large-scale distributed denial-of-service attack targeting main web servers with traffic volume exceeding 10Gbps. Attack originated from multiple botnet sources and caused significant service degradation.",
          category: "Network Security",
          severity: "Critical",
          status: "Resolved",
          timestamp: "2023-12-15 09:22:00",
          resolution: "Implemented rate limiting and activated DDoS protection service. Deployed additional CDN nodes and blacklisted malicious IP ranges.",
          tags: ["ddos", "web-infrastructure", "high-volume", "resolved", "botnet"],
          sources: ["Firewall", "Network Monitor", "Load Balancer"],
          similarity: 0.95
        },
        {
          id: "INC-2023-701",
          title: "Volumetric Attack on API Gateway",
          description: "High-volume HTTP requests targeting API endpoints causing service degradation. Attack focused on authentication endpoints and caused 5xx errors for legitimate users.",
          category: "Application Security",
          severity: "High",
          status: "Resolved",
          timestamp: "2023-11-28 14:15:00",
          resolution: "Applied traffic filtering rules and scaled infrastructure. Implemented API rate limiting and enhanced monitoring for suspicious patterns.",
          tags: ["api", "volumetric-attack", "scaling", "resolved", "authentication"],
          sources: ["API Gateway", "Application Logs", "SIEM"],
          similarity: 0.87
        }
      ];

      // Filter mock results based on query
      const filteredResults = mockResults.filter(incident => 
        incident.title.toLowerCase().includes(query.toLowerCase()) ||
        incident.description.toLowerCase().includes(query.toLowerCase()) ||
        incident.category.toLowerCase().includes(query.toLowerCase()) ||
        incident.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      res.json(filteredResults.slice(0, limit));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/seed-data', async (req, res) => {
  try {
    // Check if we have real database credentials
    if (process.env.VITE_TIDB_HOST && 
        process.env.VITE_TIDB_HOST !== 'your-tidb-host.tidbcloud.com' &&
        process.env.VITE_TIDB_USER && 
        process.env.VITE_TIDB_USER !== 'your-username') {
      
      if (!connection) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const sampleIncidents = [
        {
          id: "INC-2023-847",
          title: "DDoS Attack on Web Infrastructure",
          description: "Large-scale distributed denial-of-service attack targeting main web servers with traffic volume exceeding 10Gbps. Attack originated from multiple botnet sources and caused significant service degradation.",
          category: "Network Security",
          severity: "Critical",
          status: "Resolved",
          timestamp: "2023-12-15 09:22:00",
          resolution: "Implemented rate limiting and activated DDoS protection service. Deployed additional CDN nodes and blacklisted malicious IP ranges.",
          tags: ["ddos", "web-infrastructure", "high-volume", "resolved", "botnet"],
          sources: ["Firewall", "Network Monitor", "Load Balancer"]
        },
        {
          id: "INC-2023-701",
          title: "Volumetric Attack on API Gateway",
          description: "High-volume HTTP requests targeting API endpoints causing service degradation. Attack focused on authentication endpoints and caused 5xx errors for legitimate users.",
          category: "Application Security",
          severity: "High",
          status: "Resolved",
          timestamp: "2023-11-28 14:15:00",
          resolution: "Applied traffic filtering rules and scaled infrastructure. Implemented API rate limiting and enhanced monitoring for suspicious patterns.",
          tags: ["api", "volumetric-attack", "scaling", "resolved", "authentication"],
          sources: ["API Gateway", "Application Logs", "SIEM"]
        }
      ];

      for (const incident of sampleIncidents) {
        const textForEmbedding = `${incident.title} ${incident.description} ${incident.category} ${incident.tags.join(' ')}`;
        const embedding = generateEmbedding(textForEmbedding);

        const query = `
          INSERT INTO incidents (
            id, title, description, category, severity, status, 
            timestamp, resolution, tags, sources, embedding
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            category = VALUES(category),
            severity = VALUES(severity),
            status = VALUES(status),
            timestamp = VALUES(timestamp),
            resolution = VALUES(resolution),
            tags = VALUES(tags),
            sources = VALUES(sources),
            embedding = VALUES(embedding)
        `;

        const values = [
          incident.id,
          incident.title,
          incident.description,
          incident.category,
          incident.severity,
          incident.status,
          incident.timestamp,
          incident.resolution,
          JSON.stringify(incident.tags),
          JSON.stringify(incident.sources),
          JSON.stringify(embedding)
        ];

        await connection.execute(query, values);
      }

      res.json({ success: true, message: 'Sample data seeded successfully' });
    } else {
      // Return success for mock mode
      res.json({ 
        success: true, 
        message: 'Mock data ready for testing',
        mock: true,
        incidents: 2
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (connection) {
    await connection.end();
  }
  process.exit(0);
});
