type Review = { name?: string; rating?: number; text?: { text?: string }; authorAttribution?: { displayName?: string; uri?: string }; publishTime?: string; googleMapsUri?: string };
export default async function GoogleReviews() {
  if (!process.env.GOOGLE_PLACES_API_KEY || !process.env.GOOGLE_PLACE_ID) return null;
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(process.env.GOOGLE_PLACE_ID)}`, { headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri,displayName' }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const place = await response.json() as { rating?: number; userRatingCount?: number; reviews?: Review[]; googleMapsUri?: string };
    if (!place.reviews?.length) return null;
    return <section className="google-reviews" aria-label="Google reviews"><div><p className="exp-eyebrow">FROM GOOGLE MAPS</p><h2>{place.rating} / 5</h2><p>{place.userRatingCount} Google reviews · selected by Google</p></div><div>{place.reviews.slice(0, 3).map((review, i) => <article key={review.name || i}><a href={review.authorAttribution?.uri} target="_blank" rel="noopener noreferrer"><b>{review.authorAttribution?.displayName}</b></a><span>{review.rating} / 5</span><p>{review.text?.text}</p>{review.publishTime && <time dateTime={review.publishTime}>{review.publishTime.slice(0, 10)}</time>}{review.googleMapsUri && <a href={review.googleMapsUri} target="_blank" rel="noopener noreferrer">View on Google Maps ↗</a>}</article>)}</div><a href={place.googleMapsUri} target="_blank" rel="noopener noreferrer">Google Maps</a></section>;
  } catch { return null; }
}
