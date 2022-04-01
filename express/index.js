//formatting purposes, maybe later
var ejs = require('ejs');

// set up Express
var express = require('express');
var app = express();

// set up BodyParser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to database and model relevant classes
const mongoose = require('mongoose');
const conn = mongoose.createConnection('mongodb://localhost:27017/');
var Recipe = conn.model('Recipe', require('./Recipe.js'));
var User = conn.model('User', require('./User.js'));

var count = 0;
/*************************************************/
// Endpoints that return HTML 
/*************************************************/

// Display all recipes in recipe database
app.use('/all', (req, res) => {
	
	// find all the Recipe objects in the database
	Recipe.find( {}, (err, recipes) => {
		
		if (err) {
			res.type('html').status(200);
			console.log('uh oh' + err);
			res.write(err);
		}
		
		else {

			// Create title 
			res.type('html');
			res.write("<h1>Recipes</h1>");
	
			// show all the recipes
			recipes.forEach( (recipe) => {
				res.write("<p>");
				res.write("<a href=\"/recipe?id=" + recipe.recipe_id + "\">");
				res.write(recipe.name + " (" + recipe.recipe_id + ")");
				res.write("</a>");
				res.write("</p>");
			});
			res.write("<br><a href=\"/public/recipeform.html\">[Add a recipe]</a>");
			res.end();
		}
		}).sort({ 'name': 'asc' }); // this sorts them BEFORE rendering the results
}); 

//endpoint to view specific recipe
app.use('/recipe', (req, res) => {
	//no id 
	if(!req.query.id) {
		res.type('html').status(200);
		res.write('invalid input');
		res.end();
	}

	//find the recipe in db
	var queryObject = {"recipe_id" : req.query.id};
	Recipe.findOne( queryObject, (err, recipe) => {
		console.log(recipe);
		if(err){
			res.type('html').status(200);
		    console.log('uh oh' + err);
		    res.write(err);
		} else {
			if( recipe.length == 0) {
				res.type('html').status(200);
				res.write('no recipe for this id');
				res.end();
				return;
			} else {
				res.type('html').status(200);
				res.write('<h1>' + recipe.name + '</h1>');
				res.write('<p>ID:' + recipe.recipe_id + '</p>');
				res.write('<p>URL: <a href=<a href=\"' + recipe.url + '\">'
							+ recipe.url+'</a></p>');
				res.write('<p>Description: ' + recipe.description + '</p>');
				//TODO: adding tags and deleting recipe (other usr stories)
				res.write('<p>Tags: ' + recipe.tags + 
						'<a href=\"/add_tags\">[add tags]</a></p>');
				res.write("<a href=\"/delete?recipe_id=" + recipe.recipe_id + "\">[Delete this recipe]<br></a>");
				res.write("<a href=\"/all\">[Go back]</a>");
				res.end();
			}
		}
	})
});

//endpoint to create a new recipe and add it to db 
app.use('/create_recipe', (req,res) => {
	//I can't find how to directly get the number of objects in the db so..
	// var num_of_recipes;
	// Recipe.find( {}, (err, recipes) => {
	// 	if(err) {
	// 		//most likely not going to happen, but
	// 		res.type('html').status(200);
	// 	    console.log('uh oh' + err);
	// 	    res.write(err);
	// 	} else {
	// 		num_of_recipes = recipes.length;
	// 		console.log(num_of_recipes);
	// 	}
	// });
	

	/* some weird bugs saying num_of_recipes is not number */
	count++;
	//construct the recipe from request body
	var newRecipe = new Recipe ( {
		//Recipe.length doesn't work as well.
		recipe_id: Number(count),
		name: req.body.name,
		url: req.body.url,
		description: req.body.description,
	});
	
	newRecipe.save( (err) => {
		if(err) {
			res.type('html').status(200);
		    res.write('uh oh: ' + err);
		    console.log(err);
		    res.end();
		} else {
			res.write('successfully added ' + newRecipe.name + ' to the database')
			res.write("<a href=\"/all\">[Go back]</a>");
		}
	})
});


//possibily implementing a error endpoint ?
// app.use('/err', (req, res) => {
// 	res.send('uh oh');
// })

/*************************************************/
// Endpoints that return JSON 
/*************************************************/

app.use('/api', (req, res) => {
	Recipe.find({}, (err, recipes) => {
		if(err){
			console.log(err);
			res.type('html').status(200);
			console.log('uh oh' + err);
			res.write(err);
		} else {
			res.json(recipes);
		}
	});

});

app.use('/users', (req, res) => {
	User.find({}, (err, users) => {
		if(err){
			console.log(err);
			res.type('html').status(200);
			console.log('uh oh' + err);
			res.write(err);
		} else {
			res.json(users);
		}
	});
});

/*************************************************/
// Endpoints used for testing 
/*************************************************/

// Clear recipe database and user database 
app.use('/clearDatabase', (req, res) => {
	Recipe.deleteMany({}, (err)=>{if(err){console.log(err)}});
	User.deleteMany({}, (err)=>{if(err){console.log(err)}});
	res.end();
})

// Create some example recipes and add them to the database
app.use('/addExamples', (req, res) =>{
	count ++;

	var exampleRecipe = new Recipe ({
		recipe_id: count,
		url: "google.com",
		description: "delicious",
		name: "chicken ala google",
		tags: [],
		list_of_users : []
	});
	count ++;
	var exampleRecipe2 = new Recipe ({
		recipe_id: count,
		url: "google.net",
		description: "bad",
		name: "chicken ala fake google",
		tags: [],
		list_of_users : []
	});

	exampleRecipe.save((err)=>{if(err){console.log(err)}}); 
	exampleRecipe2.save((err)=>{if(err){console.log(err)}});

	var exampleUser = new User({
		User_id: "ruby",
		Email: "rmalusa@bmc",
		Saved_recipes:  {
			"1":[{
					date: '2022-03-29',
					rating: 10000,
					note: "I love chicken ala google"
				}],
			"2":[]
			}
		});
	exampleUser.save((err)=>{if(err){console.log(err)}});

	res.end();
})

/*************************************************/

app.use('/public', express.static('public'));
app.use('/', (req, res) => { res.redirect('/all'); } );

app.listen(3000,  () => {
	console.log('Listening on port 3000');
    });
