

const formatResponse = (rawResult) => {
    // Remove code block markers and trim
  const cleaned = rawResult
    .replace(/^```json\n/, '') // remove starting ```json
    .replace(/```$/, '')       // remove ending ```
    .trim();

  // Parse to JSON
  let parsedResult;
  try {
    parsedResult = JSON.parse(cleaned);
  } catch (error) {
    console.error("Error parsing sentiment result:", error);
    parsedResult = { error: "Invalid result format" };
  }

  return parsedResult;
}


module.exports = {formatResponse};