/** Keep geographic shapes, but do not print the answer on either guessing map. */
export const GUESS_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
