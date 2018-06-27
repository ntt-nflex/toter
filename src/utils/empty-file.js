module.exports = isEmpty

/**
 * checks if a object is empty and returns true if it is
 *
 * @param  {object} obj
 * @return {boolean} a boolean to show if a object is empty
 */
function isEmpty(obj) {
    for(const key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
