window.addEventListener('load', function (event) {
    Installer(document.getElementById('install-btn'));
});

const Installer = function(root) {
    let promptEvent;
  
    const install = function(e) {
      if(promptEvent) {
        promptEvent.prompt();
        promptEvent.userChoice
          .then(function(choiceResult) {
            promptEvent = null;
            root.classList.add('disabled');
          })
          .catch(function(installError) {
            promptEvent = null;
            root.classList.add('disabled');
          });
      }
    };
  
    const installed = function(e) {
      promptEvent = null;
      root.classList.add('disabled');
    };
  
    const beforeinstallprompt = function(e) {
      promptEvent = e;
      promptEvent.preventDefault();
      root.classList.remove('disabled');
      return false;
    };
  
    window.addEventListener('beforeinstallprompt', beforeinstallprompt);
    window.addEventListener('appinstalled', installed);
  
    root.addEventListener('click', install.bind(this));
    root.addEventListener('touchend', install.bind(this));
  };