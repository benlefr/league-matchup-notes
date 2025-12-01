<script>
  import { getRuneImagePath } from '../utils/paths.js';
  
  export let icon;
  export let alt = '';
  
  $: src = getRuneImagePath(icon);
</script>

<img {src} {alt} {...$$restProps} />
