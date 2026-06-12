require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Performance Metrics Collector
const metrics = {
  totalRequests: 0,
  statusCodes: {
    '1xx': 0,
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0
  },
  routes: {}
};

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  metrics.totalRequests++;

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);

    const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
    if (metrics.statusCodes[statusGroup] !== undefined) {
      metrics.statusCodes[statusGroup]++;
    }

    const routePattern = req.route ? `${req.method} ${req.baseUrl}${req.route.path}` : `${req.method} ${req.originalUrl.split('?')[0]}`;
    if (!metrics.routes[routePattern]) {
      metrics.routes[routePattern] = { count: 0, totalTime: 0 };
    }
    metrics.routes[routePattern].count++;
    metrics.routes[routePattern].totalTime += durationMs;
  });

  next();
};

app.use(metricsMiddleware);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'EventHive Backend is running' });
});

app.get('/api/metrics', (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const routeMetrics = {};
  for (const [route, data] of Object.entries(metrics.routes)) {
    routeMetrics[route] = {
      requestCount: data.count,
      averageResponseTimeMs: parseFloat((data.totalTime / data.count).toFixed(2)),
      totalResponseTimeMs: parseFloat(data.totalTime.toFixed(2))
    };
  }

  res.json({
    system: {
      uptimeSeconds: Math.floor(uptime),
      uptimeFormatted: formatUptime(uptime),
      memoryUsage: {
        rssMB: parseFloat((memory.rss / 1024 / 1024).toFixed(2)),
        heapTotalMB: parseFloat((memory.heapTotal / 1024 / 1024).toFixed(2)),
        heapUsedMB: parseFloat((memory.heapUsed / 1024 / 1024).toFixed(2)),
        externalMB: parseFloat((memory.external / 1024 / 1024).toFixed(2))
      }
    },
    requests: {
      total: metrics.totalRequests,
      byStatus: metrics.statusCodes
    },
    routes: routeMetrics
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/notifications', require('./routes/notifications'));

if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Network Accessible at: http://localhost:${PORT}`);
  });
}

module.exports = app; 