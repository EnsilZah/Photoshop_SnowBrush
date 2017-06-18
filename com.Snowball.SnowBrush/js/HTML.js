window.addEventListener("dragover",function(e){e = e || event; e.preventDefault();},false);
window.addEventListener("drop",function(e){e = e || event; e.preventDefault();},false);

//Prevent drag-select
document.onselectstart = function(e)
{
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
};	

function removeElement(inElement)
{
	inElement.parentElement.removeChild(inElement)
}