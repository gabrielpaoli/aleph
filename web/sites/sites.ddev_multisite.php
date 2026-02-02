<?php
/**
 * @file
 * #ddev-generated
 * This file is used to dynamically generate site entries for each multisite
 * directory based on DDEV environment information.
 */

if (getenv('IS_DDEV_PROJECT')) {
  // Get directories in sites/ that are not the default or settings directories.
  $multisite_directories = array_filter(
    scandir(__DIR__),
    function ($dir) {
      return !in_array($dir, ['default', 'settings', '.', '..']) && is_dir(__DIR__ . '/' . $dir);
    }
  );
  $ddev_project = getenv('DDEV_PROJECT');
  $ddev_tld = getenv('DDEV_TLD');
  $ddev_virtual_host = "$ddev_project.$ddev_tld";
  foreach ($multisite_directories as $site_dir) {
    $prefix = str_replace('_', '-', $site_dir);
    $site_domain = "$prefix.$ddev_virtual_host";
    $sites[$site_domain] = $site_dir;
  }
}
