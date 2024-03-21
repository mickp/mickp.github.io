/*! *****************************************************************************
Copyright (c) 2024 Mick Phillips. All rights reserved.

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
*/

class AbcElement extends HTMLElement {

  constructor() {
    super();
  }

  static resizeObserver = new ResizeObserver((entries) => {
    entries.forEach( e => { e.target.render(); });
  });

  disconnectedCallback() {
    this.constructor.resizeObserver.unobserve(this);
  }

  async connectedCallback() {
    this.constructor.resizeObserver.observe(this);
    if (this.hasAttribute('src')) {
      fetch(this.getAttribute('src'))
      .then(response => response.text() )
      .then( text => {this['abc'] = text });
    } else {
      this.abc = this.innerText;
    }
  }

  render() {
    this.innerHTML = null;
    const svgDiv = document.createElement('div')
    const initialWidth = Math.max(400, 0.9 * this.offsetWidth);

    const config = { staffwidth: 800,
                     scale: 1.,
                     format: {
                        historyfont: 'URW Bookman 12pt',
                      },
                   }

    var visualObj = ABCJS.renderAbc(svgDiv, this.abc, config )[0];
    this.appendChild(svgDiv);
    if (ABCJS.synth.supportsAudio()) {
      var synthElement = document.createElement('div');
      synthElement.setAttribute('class', 'synth-transport');
      this.appendChild(synthElement);
      var synthControl = new ABCJS.synth.SynthController();
      synthControl.load(synthElement, null, {displayRestart: true, displayPlay: true, displayProgress: true});
      synthControl.setTune(visualObj, false);
    }
  }
}

window.customElements.define("abc-div", AbcElement);
