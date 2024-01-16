var http = require('http');
var express = require('express');
var cookieParser = require('cookie-parser');
var db_api = require('./db_api');
var authorize = require('./authorize');
const { utimesSync } = require('fs');

var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('sgs90890s8g90as8rg90as8g9r8a0srg8'));
app.use(express.static('static'));
var port = 5000;


app.set('view engine', 'ejs');
app.set('views', './views');


app.get('/', async (req, res) => {
  res.render('index', {user_cookie:req.signedCookies.user});
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post( '/login', async (req, res) => {
  var username = req.body.txtUser;
  var pwd = req.body.txtPwd;
  if (await db_api.correct_pwd(username, pwd) ) {
    res.cookie('user',username,{signed:true});
    if( await db_api.is_admin(username)){
      res.cookie('role','admin',{signed:true});
    }
    else{
      res.cookie('role','user',{signed:true});
    }
    var returnUrl = req.query.returnUrl;
    if(returnUrl){
      res.redirect(returnUrl);
    }
    else{
      res.redirect('/');
    }
  } else {
    res.render( 'login', { message : "Zła nazwa logowania lub hasło" }
    );
  }
});

app.get( '/logout', authorize.authorize_user, (req, res) => {
  res.cookie('user', '', { maxAge: -1 } );
  res.cookie('role', '', { maxAge: -1 } );
  res.redirect('/')
});

app.get('/sign_up', async (req, res) => {
  res.render('sign_up');
});

app.post('/sign_up', async (req, res) => {
  var username = req.body.txtUser;
  var email = req.body.txtEmail;
  var name = req.body.txtName;
  var dob = req.body.txtDOB;
  var address = req.body.txtAddress;
  var pwd = req.body.txtPwd;
  try {
    var id = await db_api.new_user(name, dob, email, address);
    await db_api.new_login(id, username, pwd);
  }
  catch (err) {
  }
  res.redirect('/login');
});

app.get('/search', async (req, res) => {
  res.render('search');
});

app.get('/cart',authorize.authorize_user, async (req, res) => {
  var id = db_api.get_user_id(req.signedCookies.user);
  var {products} = db_api.show_cart(id);
  res.render('user/cart', {user_id: id});
});

app.get('/settings',authorize.authorize_user, async (req, res) => {
    res.render('user/settings');
});

app.get('/orders', authorize.authorize_admin, async (req, res) => {
  res.render('admin/orders');
});

app.get('/products', async (req, res) => {
  try {
    const products = await db_api.get_products();
    const colors = await db_api.get_colors();

    res.render('products', { products, colors });
  } catch (error) {
    console.error('Error fetching products or colors:', error);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
});


app.get('/product/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const rows=await db_api.get_product(productId);
    // Jeżeli nie znaleziono produktu, możesz obsłużyć to dowolnym sposobem, np. przekierowanie na stronę błędu.
    if (rows.length === 0) {
      return res.status(404).render('error', { message: 'Product not found' });
    }
    res.render('product', { product: rows[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
});

app.get('/users', authorize.authorize_admin, async (req, res) => {
  res.render('admin/users');
});

http.createServer(app).listen(3000);
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
