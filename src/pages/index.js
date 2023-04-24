import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

// Add these: Jobs, Featured, Projects Below
import { Layout, Hero, About, Research, Projects, Contact } from '@components';


const StyledMainContainer = styled.main`
  counter-reset: section;
`;

const IndexPage = ({ location }) => (
  <Layout location={location}>
    <StyledMainContainer className="fillHeight">
      <Hero />
      <About />
      <Research />
      {/* <Jobs /> */}
      <Projects />
      <Contact />
    </StyledMainContainer>
  </Layout>
);

IndexPage.propTypes = {
  location: PropTypes.object.isRequired,
};

export default IndexPage;
