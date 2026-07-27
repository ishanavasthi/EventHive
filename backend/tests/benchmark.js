const mongoose = require('mongoose');
const { performance } = require('perf_hooks');
const connectDB = require('../src/config/db');
const app = require('../src/server');

// Use a distinct port for testing
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

async function runRequest(url, method = 'GET') {
  const start = performance.now();
  try {
    const res = await fetch(url, { method });
    const text = await res.text();
    const end = performance.now();
    return {
      status: res.status,
      duration: end - start,
      success: res.status >= 200 && res.status < 300,
      size: text.length
    };
  } catch (err) {
    const end = performance.now();
    return {
      status: 500,
      duration: end - start,
      success: false,
      error: err.message,
      size: 0
    };
  }
}

async function runBatch(url, concurrency) {
  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(runRequest(url));
  }
  return Promise.all(promises);
}

function calculateStats(results) {
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const successCount = results.filter(r => r.success).length;
  const totalDuration = durations.reduce((sum, d) => sum + d, 0);
  
  const min = durations[0] || 0;
  const max = durations[durations.length - 1] || 0;
  const mean = totalDuration / results.length;
  
  // Percentiles
  const p50 = durations[Math.floor(durations.length * 0.50)] || 0;
  const p90 = durations[Math.floor(durations.length * 0.90)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  
  return {
    total: results.length,
    success: successCount,
    failed: results.length - successCount,
    successRate: parseFloat(((successCount / results.length) * 100).toFixed(2)),
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    mean: parseFloat(mean.toFixed(2)),
    p50: parseFloat(p50.toFixed(2)),
    p90: parseFloat(p90.toFixed(2)),
    p95: parseFloat(p95.toFixed(2))
  };
}

async function main() {
  console.log('=== EventHive Backend Benchmarking Tool ===');
  console.log('Connecting to database...');
  await connectDB();
  
  console.log(`Starting Express server on port ${PORT}...`);
  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server listening at ${BASE_URL}`);
    console.log('--------------------------------------------------');
    
    const results = {
      baseline: {},
      healthConcurrency: {},
      eventsConcurrency: {}
    };
    
    try {
      // 1. Baseline Latency Test (10 serial requests)
      console.log('Running baseline latency tests (10 serial requests)...');
      const healthBaselines = [];
      const eventsBaselines = [];
      
      for (let i = 0; i < 10; i++) {
        healthBaselines.push(await runRequest(`${BASE_URL}/health`));
        eventsBaselines.push(await runRequest(`${BASE_URL}/api/events?page=1&limit=30`));
      }
      
      results.baseline.health = calculateStats(healthBaselines);
      results.baseline.events = calculateStats(eventsBaselines);
      
      console.log('Baseline Results:');
      console.log(`  /health     - Mean: ${results.baseline.health.mean}ms, P95: ${results.baseline.health.p95}ms, Size: ${healthBaselines[0].size} bytes`);
      console.log(`  /api/events - Mean: ${results.baseline.events.mean}ms, P95: ${results.baseline.events.p95}ms, Size: ${eventsBaselines[0].size} bytes`);
      console.log('--------------------------------------------------');
      
      // 2. Concurrency Load Test for /health (routing + middleware, up to 200 users)
      const healthConcurrencyLevels = [10, 50, 100, 200];
      console.log('Running Concurrency Tests for /health (routing & middleware overhead)...');
      
      for (const concurrency of healthConcurrencyLevels) {
        const batchCount = 3;
        const allResults = [];
        
        const testStart = performance.now();
        for (let b = 0; b < batchCount; b++) {
          const batchResults = await runBatch(`${BASE_URL}/health`, concurrency);
          allResults.push(...batchResults);
        }
        const testEnd = performance.now();
        const totalTimeMs = testEnd - testStart;
        
        const stats = calculateStats(allResults);
        stats.throughput = parseFloat(((allResults.length / totalTimeMs) * 1000).toFixed(2));
        stats.totalTimeMs = parseFloat(totalTimeMs.toFixed(2));
        
        const metricsRes = await fetch(`${BASE_URL}/api/metrics`);
        const metricsData = await metricsRes.json();
        stats.rssMB = metricsData.system.memoryUsage.rssMB;
        stats.heapUsedMB = metricsData.system.memoryUsage.heapUsedMB;
        
        results.healthConcurrency[concurrency] = stats;
        
        console.log(`  Concurrency: ${concurrency} users`);
        console.log(`    Success Rate: ${stats.successRate}%`);
        console.log(`    Throughput:   ${stats.throughput} req/sec`);
        console.log(`    Mean Latency: ${stats.mean}ms`);
        console.log(`    P95 Latency:  ${stats.p95}ms`);
        console.log(`    RSS Memory:   ${stats.rssMB} MB`);
        console.log('--------------------------------------------------');
      }
      
      // 3. Concurrency Load Test for /api/events (Mongoose populates + 1.3MB payload, up to 15 users)
      const eventsConcurrencyLevels = [2, 5, 10, 15];
      console.log('Running Concurrency Tests for /api/events (database querying & payload serialization)...');
      
      for (const concurrency of eventsConcurrencyLevels) {
        const batchCount = 2; // 2 batches is enough to get a clean average
        const allResults = [];
        
        const testStart = performance.now();
        for (let b = 0; b < batchCount; b++) {
          const batchResults = await runBatch(`${BASE_URL}/api/events?page=1&limit=30`, concurrency);
          allResults.push(...batchResults);
        }
        const testEnd = performance.now();
        const totalTimeMs = testEnd - testStart;
        
        const stats = calculateStats(allResults);
        stats.throughput = parseFloat(((allResults.length / totalTimeMs) * 1000).toFixed(2));
        stats.totalTimeMs = parseFloat(totalTimeMs.toFixed(2));
        
        const metricsRes = await fetch(`${BASE_URL}/api/metrics`);
        const metricsData = await metricsRes.json();
        stats.rssMB = metricsData.system.memoryUsage.rssMB;
        stats.heapUsedMB = metricsData.system.memoryUsage.heapUsedMB;
        
        results.eventsConcurrency[concurrency] = stats;
        
        console.log(`  Concurrency: ${concurrency} users`);
        console.log(`    Success Rate: ${stats.successRate}%`);
        console.log(`    Throughput:   ${stats.throughput} req/sec`);
        console.log(`    Mean Latency: ${stats.mean}ms`);
        console.log(`    P95 Latency:  ${stats.p95}ms`);
        console.log(`    RSS Memory:   ${stats.rssMB} MB`);
        console.log('--------------------------------------------------');
      }
      
      // Save results
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, 'benchmark_results.json');
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`Benchmark completed successfully. Results saved to: ${outputPath}`);
      
    } catch (err) {
      console.error('Error during benchmarking:', err);
    } finally {
      console.log('Closing server and database connections...');
      server.close();
      await mongoose.connection.close();
      console.log('Benchmarking process finished.');
      process.exit(0);
    }
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
