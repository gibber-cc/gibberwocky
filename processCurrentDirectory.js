inlets = 1;
outlets =1;

setinletassist(0,"join");
//setoutletassist(0,"concatenated string (symbol)");


function anything()
{
	
	var a = arrayfromargs(messagename,arguments);
	
	
	a = a[0].split('/')
	a = a.slice(1)
	
	a = 'file:///' + a.join('/') + '/index.html'
	
    post( a )
	outlet(0,a);
}
