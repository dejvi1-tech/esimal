function r(r){if(0===r)return"Unlimited";if(!r||isNaN(r))return"0 GB";if(r>=1)return r%1==0?`${r} GB`:`${r.toFixed(1)} GB`;return`${Math.round(1024*r)} MB`}export{r as f};
