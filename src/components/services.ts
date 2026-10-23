import type { ImageMetadata } from 'astro';
import placeCardsPhoto from '../assets/images/place-cards.jpg';
import compactPhoto from '../assets/images/engraved-compact-erica.jpg';
import quotePhoto from '../assets/images/artwork-emily-bronte-quote.png';
import workbooksPhoto from '../assets/images/copperplate-workbooks.jpg';
import exemplarPhoto from '../assets/images/copperplate-capitals-exemplar.jpg';

// The five services in page order. Each is a section of the homepage (`id`) and a page of its own (`slug`). `title` is
// the section's heading and the enquiry form's choice; `label` is the footer's shorter name. Search results show the
// page's `pageTitle` and `description`, and link previews show a crop of its `photo`.
export interface Service {
  id: string;
  slug: string;
  title: string;
  label: string;
  pageTitle: string;
  description: string;
  photo: ImageMetadata;
  // Which edge of the photo the preview's crop keeps, such as 'top' (centred if left out). The image service takes only
  // edges and corners here, not percentages.
  photoPosition?: string;
}

export const services: Service[] = [
  {
    id: 'stationery',
    slug: 'event-stationery',
    title: 'Event Stationery',
    label: 'Event Stationery',
    pageTitle: 'Event Stationery & Place Cards, Birmingham',
    description:
      'Hand-lettered place cards, invitations, menus, table numbers and seating charts in Copperplate calligraphy for weddings, corporate events and dinner parties.',
    photo: placeCardsPhoto,
    photoPosition: 'top'
  },
  {
    id: 'engraving',
    slug: 'engraving-and-personalisation',
    title: 'Surface Engraving & Personalisation',
    label: 'Engraving & Personalisation',
    pageTitle: 'Engraving & Personalisation, Birmingham',
    description:
      'Hand engraving on perfume bottles, glass, metal and wood, foiling on leather goods, and live favour engraving at weddings and brand events.',
    photo: compactPhoto
  },
  {
    id: 'artwork',
    slug: 'bespoke-calligraphy-artwork',
    title: 'Bespoke Calligraphy Artwork',
    label: 'Bespoke Artwork',
    pageTitle: 'Bespoke Calligraphy Artwork, Birmingham',
    description:
      'Wedding vows, song lyrics, favourite quotes and letters hand-lettered in Copperplate calligraphy, with optional painted borders and gold-leaf edging.',
    photo: quotePhoto
  },
  {
    id: 'workshops',
    slug: 'workshops-and-workbooks',
    title: 'Workshops & Workbooks',
    label: 'Workshops & Workbooks',
    pageTitle: 'Calligraphy Workshops & Workbooks, Birmingham',
    description:
      'Beginner and intermediate Copperplate calligraphy workshops at Birmingham’s Pen Museum, plus downloadable workbooks to practise at home.',
    photo: workbooksPhoto
  },
  {
    id: 'tuition',
    slug: 'copperplate-tuition',
    title: 'Copperplate Tuition',
    label: 'Copperplate Tuition',
    pageTitle: 'Copperplate Calligraphy Tuition, Birmingham & Online',
    description:
      'Private 1-on-1 Copperplate calligraphy lessons online, at a Birmingham studio or at home, with weekly homework reviews and custom worksheets.',
    photo: exemplarPhoto,
    // The exemplar's heading, "Copperplate Capitals ~ Modern-Flourished", is at the top.
    photoPosition: 'top'
  }
];
