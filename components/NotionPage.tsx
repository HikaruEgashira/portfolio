import * as React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import cs from 'classnames'
import { useRouter } from 'next/router'
import { useLocation, useSearchParam } from 'react-use'
import BodyClassName from 'react-body-classname'
import useDarkMode from 'use-dark-mode'
import { NextSeo } from 'next-seo'

// core notion renderer
import { NotionRenderer, Code, Collection, CollectionRow } from 'react-notion-x'

// utils
import { getBlockTitle } from 'notion-utils'
import { mapPageUrl } from 'lib/map-page-url'
import { mapNotionImageUrl } from 'lib/map-image-url'
import { getPageDescription, getPageTweet } from 'lib/get-page-property'
import { searchNotion } from 'lib/search-notion'
import * as types from 'lib/types'

// components
import { CustomFont } from './CustomFont'
import { Loading } from './Loading'
import { Page404 } from './Page404'
import { PageActions } from './PageActions'
import { Footer } from './Footer'
import { PageSocial } from './PageSocial'

import styles from './styles.module.css'

const Pdf = dynamic(() => import('react-notion-x').then((notion) => notion.Pdf))

const Equation = dynamic(() =>
  import('react-notion-x').then((notion) => notion.Equation)
)

const Tweet = dynamic(() => import('react-tweet-embed'))

const Modal = dynamic(
  () => import('react-notion-x').then((notion) => notion.Modal),
  { ssr: false }
)

export const NotionPage: React.FC<types.PageProps> = ({
  site,
  recordMap,
  error,
  pageId
}) => {
  const router = useRouter()
  const location = useLocation()
  const lite = useSearchParam('lite')

  const params: any = {}
  if (lite) params.lite = lite

  // lite mode is for oembed
  const isLiteMode = lite === 'true'
  const searchParams = new URLSearchParams(params)

  const darkMode = useDarkMode(true, { classNameDark: 'dark-mode' })

  if (router.isFallback) {
    return <Loading />
  }

  const keys = Object.keys(recordMap?.block || {})
  const block = recordMap?.block?.[keys[0]]?.value

  if (error || !site || !keys.length || !block) {
    return <Page404 pageId={pageId} error={error} />
  }

  const title = getBlockTitle(block, recordMap) || site.name

  const siteMapPageUrl = mapPageUrl(site, recordMap, searchParams)

  // const isRootPage =
  //   parsePageId(block.id) === parsePageId(site.rootNotionPageId)
  const isBlogPost =
    block.type === 'page' && block.parent_table === 'collection'
  const showTableOfContents = !!isBlogPost
  const minTableOfContentsItems = 3

  const socialDescription = getPageDescription(block, recordMap)

  const comments: React.ReactNode = null
  let pageAside: React.ReactChild = null

  const isValidDomain = location.hostname !== site.domain

  // only display comments and page actions on blog post pages
  if (isBlogPost) {
    const tweet = getPageTweet(block, recordMap)
    if (tweet) {
      pageAside = <PageActions tweet={tweet} />
    }
  } else {
    pageAside = <PageSocial />
  }

  return (
    <>
      <NextSeo
        title={title}
        description={socialDescription}
        noindex={isValidDomain}
        nofollow={isValidDomain}
      />
      <CustomFont site={site} />

      {isLiteMode && <BodyClassName className='notion-lite' />}

      <NotionRenderer
        bodyClassName={cs(
          styles.notion,
          pageId === site.rootNotionPageId && 'index-page'
        )}
        components={{
          // eslint-disable-next-line react/display-name
          pageLink: ({
            href,
            as,
            passHref,
            prefetch,
            replace,
            scroll,
            shallow,
            locale,
            ...props
          }) => (
            <Link
              href={href}
              as={as}
              passHref={passHref}
              prefetch={prefetch}
              replace={replace}
              scroll={scroll}
              shallow={shallow}
              locale={locale}
            >
              <a {...props} />
            </Link>
          ),
          code: Code,
          collection: Collection,
          collectionRow: CollectionRow,
          tweet: Tweet,
          modal: Modal,
          pdf: Pdf,
          equation: Equation
        }}
        recordMap={recordMap}
        rootPageId={site.rootNotionPageId}
        fullPage={!isLiteMode}
        darkMode={darkMode.value}
        previewImages={site.previewImages !== false}
        showCollectionViewDropdown={false}
        showTableOfContents={showTableOfContents}
        minTableOfContentsItems={minTableOfContentsItems}
        // defaultPageIcon={config.defaultPageIcon}
        // defaultPageCover={config.defaultPageCover}
        // defaultPageCoverPosition={config.defaultPageCoverPosition}
        mapPageUrl={siteMapPageUrl}
        mapImageUrl={mapNotionImageUrl}
        searchNotion={searchNotion}
        pageFooter={comments}
        pageAside={pageAside}
        footer={
          <Footer
            isDarkMode={darkMode.value}
            toggleDarkMode={darkMode.toggle}
          />
        }
      />
    </>
  )
}
