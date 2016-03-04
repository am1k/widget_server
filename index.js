var connection = require('./connection.js');
var data = require('./info-collection.js');


connection.app.get('/', function(req, res){
    console.log(req, res, 1111);
});

connection.io.on('connection', function(socket){
    socket.emit('basicData', data);
});

connection.io.on('disconnect', function(){
    console.log(arguments)
});

connection.http.listen(3000, function(){
    console.log('listening on *:3000');
});

function generateRandom(min,max){
    return (Math.random() * (min, max)).toFixed();
}

function updateData(data){
    var buyRatio = generateRandom(data.min, data.max);
    data.prevBuy =  data.buy || 0;
    data.prevSell =  data.sell || 0;
    data.sellRatio = 100 - buyRatio;
    data.buyRatio = buyRatio;
    data.sell = generateRandom(data.min, data.max);
    data.buy = generateRandom(data.min, data.max);
    data.ratio = generateRandom(data.min, data.max);
    data.lastCall = Date.now();
}



function createData(){
    data.forEach(updateData);
}

function tick(data){

    for(var i = 0; i < data.length - 1; i++){
        if( (Date.now() - data[i].lastCall) >= data[i].delay){
            updateData(data[i]);
            console.log(data[i].name);
            connection.io.emit('sentData', formatData( data[i] ));
            data[i].lastCall = Date.now();
        }
    }

    setTimeout(tick, 100, data);
}

function formatData(data){
    var res = {};

    Object.keys(data).filter(function(key){
       return key !== 'lastCall';
    }).reduce(function(prev, cur){
        prev[cur] = data[cur];
        return res;
    }, res);

    return res;
}

createData();
tick(data);
