$(document).ready(function(){
    var template = $("#template").html();
    Mustache.parse(template);

    var d = new Date();

    var month = d.getMonth()+1;

    var M = ((''+month).length < 2 ? '0' : '');

    
    var rendered = Mustache.render(template, {
        access_date: {
            month: new Date().getMonth()+1,
            month_prefix: M,
            day: new Date().getDate(),
            year: new Date().getFullYear(),
        },
    })
    $("#target").html(rendered);
});