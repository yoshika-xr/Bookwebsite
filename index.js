import express, { response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "JayaRamar@12",
  port: 5432,
});
let searchBook=[];
const API_URL="https://openlibrary.org/search.json?"
db.connect();
//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/",async(req,res)=>{
  res.render("index.ejs");
  
})
//homepage
app.post("/search", async (req,res)=>{
    // console.log(req.body)
    const result=req.body.book;
    const apiurl=`https://openlibrary.org/search.json?q=${result}`;
    try{
      const response = await axios.get(apiurl);
      const books = response.data.docs.slice(0, 10).map(book => ({
        title: book.title || 'No title',
        author: book.author_name?.join(', ') || 'Unknown',
        image: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : '/images/noima.png',
        date: book.first_publish_year || "no date",
    }));
    // console.log(books);
    searchBook=books;
    res.render("search_result.ejs",{allbooks:searchBook});
  }catch(error){
    console.error(error);
    res.status(500).json({error:'failed to fetch book information'});
  }
});
app.get("/search",async (req,res)=>{
  console.log(searchBook)
  res.render("search_result.ejs",{allbooks:searchBook});
});
app.get("/addtofav",async(req,res)=>{
  const{title,author,image}=req.query;
  //  console.log(title);
  //  console.log(author);
  //  console.log(image);
 
  res.render("addtofav.ejs",{title:title,author:author,image:image});
});
app.post("/addtofav",async(req,res)=>{
  const { title, author, image, score, reason, recommend } = req.body;
  const check=await db.query("SELECT * FROM wishlist WHERE title=$1 AND author=$2",[title,author]);

  if(check.rows.length>0){
    return res.send("This is book already existed in your wishlist");
  }
  try {
    await db.query(
    'INSERT INTO wishlist (title, author, image, score, reason, recommend) VALUES ($1, $2, $3, $4, $5, $6)',
      [title, author, image, score, reason, recommend]
    );
    res.redirect('/wishlist');
  } catch (err) {
    res.send('Erroring saving for wishlist');
  }
});
app.get('/wishlist', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM wishlist');
    // console.log(result.rows);
    res.render('wishlist.ejs', { books: result.rows });
  } catch (err) {
    res.send('Error loading wishlist');
  }
});
app.listen(port, () => {
  console.log(`server is running at http://localhost${port}`);
});