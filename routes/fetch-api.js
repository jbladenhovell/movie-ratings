const axios = require('axios');
const fs = require('fs');
const CryptoJS = require('crypto-js');

const fetch = async (mts, lang) => {
  try {
    const apiKey = loadApiKey();
    const urls = mts.map((mt) => `https://www.omdbapi.com/?t=${mt}&ApiKey=${apiKey}`);

    const allRes = await axios.all(urls.map((u) => axios.get(u)));
    const sortedMovies = sortByAvgRating(allRes, lang);
    return sortedMovies;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
};

const loadApiKey = () => {
  const file = fs.readFileSync('env.config', { encoding: 'utf8', flag: 'r' });
  const configLines = file.split('\n');
  const encKey = configLines.find((x) => x.indexOf('apikey') >= 0).split(':')[1];
  const decKey = decryptApiKey(encKey);
  return decKey;
};

const decryptApiKey = (str) => {
  const decKey = CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Utf8);
  return decKey;
};

const avgRating = (d) => {
  let sum = 0;
  let count = 0;
  for (const r of d.Ratings) {
    console.log(r);
    if (r.Value.endsWith('%')) sum += (+r.Value.replace('%', '')) / 100;
    else {
      const nums = r.Value.split('/');
      sum += nums[0] / nums[1];
    }
    count++;
  }
  return +(sum / count).toFixed(2);
};

const sortByAvgRating = (allRes, lang) => {
  const fullSorted = allRes.map((x) => x.data).filter((x) => lang === 'any' || x.Language.toLowerCase().includes(lang)).sort((a, b) => avgRating(b) - avgRating(a));
  const filteredSorted = [];
  for (const m of fullSorted) {
    const obj = {};
    obj.title = m.Title;
    obj.year = m.Year;
    obj.plot = m.Plot;
    obj.lang = m.Language;
    obj.rating = avgRating(m);
    filteredSorted.push(obj);
  }
  return filteredSorted;
};

module.exports = { fetch };
