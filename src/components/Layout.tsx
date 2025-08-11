import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  children,
}) => {
  return (
    <>
      {/* could be a header */}

      <main>
        {children}
      </main>

      {/*  could be a footer */}
    </>
  );
};

export default Layout;