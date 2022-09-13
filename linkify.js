// this function, linkify converts all text in DOM in url format and enclose them in anchor tags

let mutationObserver;

function getMutationObserver() {
    return mutationObserver;
}

// const events = require('events');
// const fs = require('fs');
// const readline = require('readline');
import { once } from 'events';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';


async function processLineByLine() {
    try {
      let tlds = [];
      const rl = createInterface({
        input: createReadStream('./tlds-alpha-by-domain.txt'),
        crlfDelay: Infinity
      });
  
      rl.on('line', (line) => {
          if(! (line.slice(0,1) === '#')) {
              tlds.push(line);
          }
      });
  
      await once(rl, 'close');

      return tlds;
    } catch (err) {
      console.error(err);
      return ['com', 'ca'];
    }
  };



/**
 * enclose url in the text of type String inside anchor tag
 * 
 * @param {} text: String
 * @returns String
 */
function urlify(text) {
    var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    // var urlRegex = RegExp('(((https?:\/\/)|(www\.))[^\s]+)', 'gmi');
    //var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url,b,c) {
        var url2 = (c == 'www.') ?  'http://' +url : url;
        if (url2.slice(-1) === ".") {
            url2 = url2.slice(0, -1);
            return '<a href="' +url2+ '" target="_blank">' + url2 + '</a>' + '.';
        }
        return '<a href="' +url2+ '" target="_blank">' + url + '</a>';
    }) 
}

// source:
// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
// does not suppor IE (temeplate element)
function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

/**
 * Finds leaf text node recursively and applies action on the node(adds anchor tag)
 * 
 * @param {*} node 
 * @returns 
 */
function operateOnTextInDOM(node) {
    //base case
    if (node.childNodes.length === 0) {
        if(node.nodeName === '#text') {
            let modifiedText = urlify(node.data);
            
            // quit if no anchor tag is generated
            if (node.data === modifiedText) return; 
            // quit if the inner text is child of an anchor element
            if (node.parentNode.nodeName.toLowerCase() === "a" ) return;
            nodesFragment = new DocumentFragment();
            newNode = htmlToElements(modifiedText);

            for (const n of newNode) {
                if(!(n.nodeName.toLowerCase() === "#text" || n.nodeName.toLowerCase() === "a" )) return ;
                nodesFragment.append(n.cloneNode(true));
            }
            
            console.log("node", node, node.parentNode.nodeName);
            console.log("node f", nodesFragment.childNodes);
            node.parentNode.replaceChild(nodesFragment, node);
        }
        return;
    }
    
    // TODO:
    // node.childNodes is dynamical nodeList and it is being looped and modified at the same time
    // It can be improved by getting static node list instead 
    for (let i=0; i < node.childNodes.length; i++) {
        operateOnTextInDOM(node.childNodes[i])
    }

}


function operateOnTextInDomWrapper() {
    console.log("operateOnTextInDom")
    operateOnTextInDOM(document.querySelector('body'));

}


window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    operateOnTextInDomWrapper();

    //operateOnTextInDOM fires when it detects change in the DOM
    //the action is delayed by the amount specified in the setTimeOut 
    //to prevent the function from firing on evey small DOM change event that occurs in sequence over a short period of time
    mutationObserver = new MutationObserver(list => {
        const observer = getMutationObserver();
        if (!observer) return;
        observer.disconnect();
        setTimeout(() => {
            operateOnTextInDomWrapper();
            observer.observe(document.body, {childList: true, subtree: true});
        }, 1000)
      });
    mutationObserver.observe(document.body, {childList: true, subtree: true});
});
