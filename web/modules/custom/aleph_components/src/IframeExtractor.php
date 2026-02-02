<?php

namespace Drupal\aleph_components;

class IframeExtractor {

  function url($iframe){
    $url = '';

    preg_match('/src="([^"]+)"/', $iframe, $match);
    if(!empty($match[1])){
      $url = $match[1];
    }

    return $url;
  }

}
