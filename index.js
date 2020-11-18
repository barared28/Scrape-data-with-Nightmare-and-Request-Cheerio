const request = require("request-promise");
const cheerio = require("cheerio");
const reqularRequest = require("request");
const fs = require("fs");
const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: true });

const sampleResults = {
  title: "blabla",
  rank: 1,
  imdbRating: 8.4,
  desciptionUrl: "https://imdb.com",
  posterUrl: "https://imdb.com",
  posterImageUrl: "https://imdb.com",
};

async function scrapeTitlesRanksAndRatings() {
  const result = await request.get(
    "https://www.imdb.com/chart/moviemeter/?ref_=nv_mv_mpm"
  );
  const $ = await cheerio.load(result);

  const movies = await $(".lister-list tr").map((i, e) => e);
  const bigData = [];

  for (let i = 0; i < movies.length; i++) {
    const e = movies[i];
    const title = await $(e).find("td.titleColumn > a").text();
    const desciptionUrl = await $(e).find("td.titleColumn > a").attr("href");
    const imdbRating = await $(e).find(".imdbRating strong").text();
    const posterUrl = await (async () => {
      try {
        const html = await request.get(`https://www.imdb.com/${desciptionUrl}`);
        const $ = await cheerio.load(html);
        return await $("div.poster > a").attr("href");
      } catch (error) {
        console.log(error);
      }
    })();
    const posterImageUrl = await (async () => {
      try {
        return await nightmare
          .goto(`https://www.imdb.com/${posterUrl}`)
          .evaluate(() => document.querySelector("div.styles__MediaViewerContainerNoNav-q67kgi-1.kOoZVO.media-viewer > div:nth-child(4) > img").getAttribute("src")  );
      } catch (error) {
        console.log(error);
      }
    })();
    await request.get(posterImageUrl).pipe(fs.createWriteStream(`./posters/${i + 1}.png`))
    await bigData.push({
      title,
      imdbRating,
      rank: i + 1,
      desciptionUrl,
      posterUrl,
      posterImageUrl,
      posterPath : `/posters/${i + 1}.png`
    });
    await fs.writeFileSync('./data.json', JSON.stringify(bigData))
    console.log(bigData[i]);
  }
}

scrapeTitlesRanksAndRatings();