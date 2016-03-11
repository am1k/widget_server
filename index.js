var _ = require('lodash');
var connection = require('./connection.js');
var data = require('./info-collection.js');
var schema = require('./schemas');
var listSchema = schema.list;
var infoSchema = schema.info;
//var dataList = {};

connection.io.on('connection', function(socket){
    var currentRoom;
    socket.emit('basicList', data.map(function(item){
        return formatData(item, listSchema);
    }));

    socket.on('changeCurrency', function(id){
        currentRoom && socket.leave(currentRoom);
        socket.join(currentRoom);
        currentRoom = id;

        socket.emit('sentData', formatData( _.find(data, {id: currentRoom}), infoSchema ));
    });
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
    data.sellRatio = 100 - buyRatio;
    data.buyRatio = buyRatio;
    data.prevbuy =  data.buy || 0;
    data.prevsell =  data.sell || 0;
    data.sell = generateRandom(data.min, data.max);
    data.buy = generateRandom(data.min, data.max);
    data.ratio = generateRandom(data.min, data.max);
    data.lastCall = Date.now();

}

/*function updateDataList(data){
    var buyRatio = generateRandom(data.min, data.max);
    dataList.sellRatio = 100 - buyRatio;
    dataList.buyRatio = buyRatio;
    dataList.name = data.name;
    dataList.id = data.id;
}*/

function createData(){
    data.forEach(updateData);
    //data.forEach(updateDataList);*/
}

function tick(data){

    for(var i = 0; i < data.length; i++){
        if( (Date.now() - data[i].lastCall) >= data[i].delay){
            updateData(data[i]);
            connection.io.to(data[i].id).emit('sentData', formatData( data[i], infoSchema) );
            connection.io.emit('changeList', formatData( data[i], listSchema) );
            data[i].lastCall = Date.now();
        }
    }

    setTimeout(tick, 100, data);
}

function formatData(data, basicSchema){
    var res = {};
    //
    //Object.keys(data).filter(function(key){
    //   return key !== 'lastCall';
    //}).reduce(function(prev, cur){
    //    prev[cur] = data[cur];
    //    return res;
    //}, res);
    //
    //return res;

    for(var key in data){
        if(data.hasOwnProperty(key) && basicSchema.hasOwnProperty(key)){
            res[key] = data[key];
        }
    }

    return res;
}

createData();
tick(data);
