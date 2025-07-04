import axios from "axios";
import cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

const keywords = ["Digital", "Innovation", "Product", "Director"];
const url =
  "https://mycareer.hsbc.com/en_GB/external/SearchJobs/?1017=%5B67211%5D&1017_format=812&listFilterMode=1&pipelineRecordsPerPage=50";

async function fetchJobs() {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const jobs = [];

    $("a.pipeline-title-link").each((i, el) => {
      const title = $(el).text().trim();
      const jobUrl = "https://mycareer.hsbc.com" + $(el).attr("href");

      if (keywords.some((k) => title.toLowerCase().includes(k.toLowerCase()))) {
        jobs.push({
          title,
          url: jobUrl,
        });
      }
    });

    console.log(`Found ${jobs.length} matching job(s).`);

    for (const job of jobs) {
      await postToAirtable(job);
    }
  } catch (error) {
    console.error("Error fetching jobs:", error.message);
  }
}

async function postToAirtable(job) {
  try {
    const response = await axios.post(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        fields: {
          "Job Title": job.title,
          "Company": "HSBC",
          "Location": "Hong Kong",
          "Link to Role": job.url,
          "Date Posted": new Date().toISOString().split("T")[0],
          "Region": "HK",
          "Status": "To Review",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Posted: ${job.title}`);
  } catch (error) {
    console.error("Error posting to Airtable:", error.response?.data || error.message);
  }
}

fetchJobs();
