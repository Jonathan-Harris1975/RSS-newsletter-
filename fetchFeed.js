import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export async function fetchRssItems(url} {
  try {
    const response = await axios.get(url);
    const parsedData = await parseStringPromise(response.data);
    const items = parsedData.rss.channel[0].item;
    return items;
  } catch (error} {
    console.error('Error fetching RSS feed:', error);
    throw new Error('Failed to fetch RSS feed');
  }
}
