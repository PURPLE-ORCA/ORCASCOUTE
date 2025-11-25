"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddContactDialog } from "@/components/add-contact-dialog";
import { AddCompanyDialog } from "@/components/add-company-dialog";
import { ContactCard } from "@/components/contact-card";
import { CompanyCard } from "@/components/company-card";
import { ContactDetailView } from "@/components/contact-detail-view";
import { CompanyDetailView } from "@/components/company-detail-view";
import { Spinner } from "@/components/ui/spinner";
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconBuilding,
  IconAddressBook,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";

export default function EmailsPage() {
  const contacts = useQuery(api.contacts.getAll);
  const companies = useQuery(api.companies.getAll);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] =
    useState<Id<"contacts"> | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<Id<"companies"> | null>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  if (contacts === undefined || companies === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      (contact.email?.toLowerCase().includes(query) ?? false) ||
      (contact.company?.name.toLowerCase().includes(query) ?? false) ||
      (contact.position?.toLowerCase().includes(query) ?? false)
    );
  });

  // Filter companies based on search query
  const filteredCompanies = companies.filter((company) => {
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      company.emails.some((e) => e.toLowerCase().includes(query))
    );
  });

  const hasData = contacts.length > 0 || companies.length > 0;

  return (
    <>
      <div className="container mx-auto max-w-6xl p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email DB</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your professional contacts and company relationships
            </p>
          </div>
          <div className="flex gap-2">
            <AddCompanyDialog>
              <Button variant="outline">
                <IconBuilding className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </AddCompanyDialog>
            <AddContactDialog>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </AddContactDialog>
          </div>
        </div>

        {/* Search Bar */}
        {hasData && (
          <div className="mb-6">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Content Tabs */}
        {!hasData ? (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <IconAddressBook className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              Your Email DB is empty
            </h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Start building your network by adding companies and contacts.
            </p>
            <div className="flex gap-4">
              <AddCompanyDialog>
                <Button variant="outline">
                  <IconBuilding className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </AddCompanyDialog>
              <AddContactDialog>
                <Button>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </AddContactDialog>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="companies">
                Companies
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {filteredCompanies.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {filteredContacts.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              {/* Companies Section */}
              {filteredCompanies.length > 0 && (
                <section>
                  <h2 className="mb-4 font-semibold text-lg flex items-center gap-2">
                    <IconBuilding className="h-5 w-5" />
                    Companies
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {filteredCompanies.map((company) => (
                        <CompanyCard
                          key={company._id}
                          company={company}
                          onView={() => setSelectedCompanyId(company._id)}
                          onEdit={() => setEditingCompany(company)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {/* Contacts Section */}
              {filteredContacts.length > 0 && (
                <section>
                  <h2 className="mb-4 font-semibold text-lg flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Contacts
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {filteredContacts.map((contact) => (
                        <ContactCard
                          key={contact._id}
                          contact={contact}
                          onView={() => setSelectedContactId(contact._id)}
                          onEdit={() => setEditingContact(contact)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {filteredCompanies.length === 0 &&
                filteredContacts.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background/50 p-12 text-center">
                    <IconSearch className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No results found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search query
                    </p>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="companies">
              {filteredCompanies.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background/50 p-12 text-center">
                  <IconSearch className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No companies found
                  </h3>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filteredCompanies.map((company) => (
                      <CompanyCard
                        key={company._id}
                        company={company}
                        onView={() => setSelectedCompanyId(company._id)}
                        onEdit={() => setEditingCompany(company)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contacts">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-background/50 p-12 text-center">
                  <IconSearch className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No contacts found
                  </h3>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filteredContacts.map((contact) => (
                      <ContactCard
                        key={contact._id}
                        contact={contact}
                        onView={() => setSelectedContactId(contact._id)}
                        onEdit={() => setEditingContact(contact)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Detail Views */}
      <ContactDetailView
        contactId={selectedContactId}
        onClose={() => setSelectedContactId(null)}
      />
      <CompanyDetailView
        companyId={selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
      />

      {/* Edit Dialogs */}
      {editingContact && (
        <AddContactDialog
          contact={editingContact}
          onSuccess={() => setEditingContact(null)}
        >
          <div />
        </AddContactDialog>
      )}
      {editingCompany && (
        <AddCompanyDialog
          company={editingCompany}
          onSuccess={() => setEditingCompany(null)}
        >
          <div />
        </AddCompanyDialog>
      )}
    </>
  );
}
