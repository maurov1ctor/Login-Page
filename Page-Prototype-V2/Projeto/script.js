function consultarMensalidade() {
    alert('Consulta de mensalidade simulada!');
}


function buttonMenu() {
    var elemento = document.getElementById('menu')
    
    elemento.addEventListener('click', function() {
        elemento.classList.toggle('userInfo')
        
    } )

}