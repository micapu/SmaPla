
function signIn(){
    $('#sign-in').hide();
    $('.sign-up').css('display','block');
    $('.sign-in').css('display','none');
    $('#sign-up').show();

}
function signUp(){
    $('#sign-in').show();
    $('.sign-in').css('display','block');
    $('.sign-up').css('display','none');
    $('#sign-up').hide();
}


$(document).ready(function(){
    $('#sign-up').on('click',function(){
        signUp();
    });
    $('#sign-in').on('click',function(){
        signIn();
    });
    var GET = {};
    var query = window.location.search.substring(1).split("&");
    for (var i = 0, max = query.length; i < max; i++)
    {
        if (query[i] === "") // check for trailing & with no param
            continue;

        var param = query[i].split("=");
        GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
    }
    var signError = $('#sign-error');
    var regError = $('#reg-error');
    var regErrorF = function(m){
        signUp();
        regError.css('display','block');
        regError.html('Error :'+m);

    }
    switch(GET['resp']){
        case 'name':
            regErrorF('Invalid Name.');
            break;
        case 'email':
            regErrorF('Invalid Email.');
            break;
        case 'dupe':
            regErrorF("Somebody already has that email/username.");
            break;
        case 'pass':
            regErrorF('Password too short.');
            break;
        case 'keyuse':
            regErrorF('Key has been used up.');
            break;
        case 'key':
            regErrorF('Key does not exist.');
            break;
        case 'mismatch':
            regErrorF("Passwords do not match.");
            break;
        case 'empty':
            regErrorF('Field left empty.');
            break;
        case 'error':
            signIn();
            signError.css('display','block');
            signError.html('Error: Invalid Credentials.');
            break;
        case 'success':
            signIn();
            signError.css('display','block');
            signError.html('Successfully Signed Up.');
            break;
    }

});