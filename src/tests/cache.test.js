const { cacheService } = require('../services/cache.service');

/**
 * Simple cache service test
 */
async function testCacheService() {
  console.log('Testing Cache Service...');
  
  // Set a value
  const key = 'test:key';
  const value = 'test value';
  
  console.log(`Setting ${key} = ${value}`);
  const setResult = await cacheService.set(key, value);
  console.log(`Set result: ${setResult}`);
  
  // Get the value
  console.log(`Getting ${key}`);
  const getResult = await cacheService.get(key);
  console.log(`Get result: ${getResult}`);
  
  // Check if exists
  console.log(`Checking if ${key} exists`);
  const existsResult = await cacheService.exists(key);
  console.log(`Exists result: ${existsResult}`);
  
  // Delete the value
  console.log(`Deleting ${key}`);
  const deleteResult = await cacheService.delete(key);
  console.log(`Delete result: ${deleteResult}`);
  
  // Check if exists after delete
  console.log(`Checking if ${key} exists after deletion`);
  const existsAfterDelete = await cacheService.exists(key);
  console.log(`Exists result: ${existsAfterDelete}`);
  
  // Test JSON functions
  const jsonKey = 'test:json';
  const jsonValue = { name: 'test', value: 123, nested: { key: 'value' } };
  
  console.log(`Setting JSON ${jsonKey}`, jsonValue);
  const setJsonResult = await cacheService.setJSON(jsonKey, jsonValue);
  console.log(`Set JSON result: ${setJsonResult}`);
  
  console.log(`Getting JSON ${jsonKey}`);
  const getJsonResult = await cacheService.getJSON(jsonKey);
  console.log(`Get JSON result:`, getJsonResult);
  
  console.log(`Deleting JSON ${jsonKey}`);
  await cacheService.delete(jsonKey);
  
  // Get status
  console.log('Getting cache status');
  const status = await cacheService.getStatus();
  console.log('Cache status:', status);
  
  // Close connection
  await cacheService.close();
  console.log('Test completed');
}

// Run the test
testCacheService().catch(console.error);